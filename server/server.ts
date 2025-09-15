// server.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createWorker, types as mediasoupTypes } from "mediasoup";
import OpenAI from "openai";
import { File } from 'buffer'; // Node.js 15.0.0 이상에서 File 클래스를 사용하기 위한 정확한 임포트

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // STT를 위해 바디파서 제한 확장 (오디오 데이터가 클 수 있음)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 클라이언트 앱의 도메인으로 설정
    methods: ["GET", "POST"],
  },
});

const PORT = 4000;

// 전역 워커
let worker: mediasoupTypes.Worker;


interface Room {
  router: mediasoupTypes.Router;
  peers: Map<string, { // 룸에 속한 피어(소켓)들의 맵
    sendTransport?: mediasoupTypes.WebRtcTransport;
    recvTransport?: mediasoupTypes.WebRtcTransport;
    producers: Map<string, mediasoupTypes.Producer>;
    consumers: Map<string, mediasoupTypes.Consumer>;
    socketId: string;
  }>;
}


const rooms = new Map<string, Room>();

const socketToRoom = new Map<string, string>();

const mediaCodecs: mediasoupTypes.RtpCodecCapability[] = [
  { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
  { kind: "video", mimeType: "video/VP8", clockRate: 90000 },

];

// Mediasoup 워커를 서버 시작 시 한 번 초기화
const initMediasoupWorker = async () => {
  worker = await createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  });
  worker.on('died', () => {
    console.error('Mediasoup 워커가 종료되었습니다. 2초 후 서버를 종료합니다...');
    setTimeout(() => process.exit(1), 2000);
  });
  console.log("[Mediasoup] 워커 초기화 완료");
};


const createRoomRouter = async (): Promise<mediasoupTypes.Router> => {
  if (!worker) {
    throw new Error("Mediasoup 워커가 초기화되지 않았습니다!");
  }
  const roomRouter = await worker.createRouter({ mediaCodecs });
  console.log("[Mediasoup] 새로운 라우터가 방을 위해 생성되었습니다.");
  return roomRouter;
};

const createWebRtcTransport = async (router: mediasoupTypes.Router): Promise<mediasoupTypes.WebRtcTransport> => {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: "127.0.0.1" }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000,
  });

  transport.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'closed') {
      console.log(`Transport ${transport.id} DTLS 상태가 closed로 변경되었습니다.`);
      transport.close();
    }
  });

  return transport;
};

// STT를 위한 API 엔드포인트
app.post('/api/stt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioContent } = req.body;
    if (!audioContent) {
      res.status(400).json({ error: 'audioContent가 누락되었습니다.' });
      return;
    }


    const base64Audio = audioContent.split(',')[1];
    if (!base64Audio) {
      res.status(400).json({ error: '오디오 데이터 형식이 올바르지 않습니다.' });
      return;
    }

    // base64를 Buffer로 변환
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Whisper API 호출을 위한 파일 생성. Node.js 'buffer' 모듈은 File 클래스를 제공합니다.
    // 올바른 Mime Type을 사용하는 것이 중요합니다. webm의 opus의 경우, audio/webm; codecs=opus 입니다.
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm; codecs=opus' });

    // Whisper API 호출
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "ko",
      response_format: "text"
    });

    const transcript = response.toString();

    if (!transcript || transcript.trim() === "") {
      res.status(400).json({ error: '음성 인식 결과가 없습니다.' });
      return;
    }

    res.json({ transcript });
  } catch (err) {
    console.error('STT API 오류:', err);
    res.status(500).json({ error: 'STT 변환 실패', details: err instanceof Error ? err.message : String(err) });
  }
});


io.on("connection", (socket) => {
  console.log("[Socket] 연결됨:", socket.id);

  socket.on("joinRoom", async (roomId: string, cb) => {
    // 룸이 없으면 생성
    if (!rooms.has(roomId)) {
      const roomRouter = await createRoomRouter(); // 방 생성 시 새로운 라우터 생성
      rooms.set(roomId, {
        router: roomRouter,
        peers: new Map(),
      });
      console.log(`[Room] 방 ${roomId}가 생성되었습니다.`);
    }

    const currentRoom = rooms.get(roomId)!; // 현재 룸 데이터 가져오기

    // 룸의 피어 맵에 새 피어 추가
    currentRoom.peers.set(socket.id, {
      producers: new Map(),
      consumers: new Map(), // 컨슈머도 Map으로 관리하는 것이 좋습니다.
      socketId: socket.id,
    });

    socket.join(roomId); // Socket.IO 룸에 조인
    socketToRoom.set(socket.id, roomId); // 이 소켓이 어떤 룸에 속하는지 추적

    const existingProducers = Array.from(currentRoom.peers.values())
      .flatMap(peer => Array.from(peer.producers.values())) // 각 피어의 모든 프로듀서들을 평탄화
      .map(producer => ({ // 클라이언트에 보낼 형식으로 변환
        producerId: producer.id,
        kind: producer.kind,
        appData: producer.appData,
        socketId: socketToRoom.get(producer.appData.socketId as string) || producer.appData.socketId, // 프로듀서의 원본 소켓 ID를 사용할 수도 있습니다.
      }));

    if (existingProducers.length > 0) {
      console.log(`[Socket] 새 클라이언트 ${socket.id}에게 ${existingProducers.length}개의 기존 프로듀서를 보냅니다.`);
      socket.emit("existingProducers", existingProducers);
    }

    // 클라이언트에게 현재 룸 라우터의 RTP Capabilities를 응답
    cb(currentRoom.router.rtpCapabilities);
    console.log(`[Socket] 소켓 ${socket.id}가 방 ${roomId}에 조인했습니다.`);
  });

  socket.on("getRouterRtpCapabilities", (_, cb) => {
    // 이 이벤트는 'joinRoom'에서 이미 라우터 RTP를 보내주므로 필요 없을 수 있습니다.
    // 만약 필요하다면, 특정 룸의 라우터 RTP를 보내주어야 합니다.
    const roomId = socketToRoom.get(socket.id);
    if (roomId && rooms.has(roomId)) {
      cb(rooms.get(roomId)!.router.rtpCapabilities);
    } else {
      console.warn(`[Socket] getRouterRtpCapabilities 요청 시 방 ${roomId}를 찾을 수 없습니다.`);
      cb(null); // 에러 처리 또는 적절한 응답
    }
  });

  socket.on("create-transport", async (_, cb) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId || !rooms.has(roomId)) {
      console.error(`[Transport] Transport 생성 중 방 ${roomId}를 찾을 수 없습니다.`);
      cb(null); return;
    }
    const currentRoom = rooms.get(roomId)!;
    const transport = await createWebRtcTransport(currentRoom.router); // 해당 룸의 라우터 사용
    const peer = currentRoom.peers.get(socket.id);
    if (peer) peer.sendTransport = transport;

    cb({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
  });

  socket.on("create-recv-transport", async (_, cb) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId || !rooms.has(roomId)) {
      console.error(`[Transport] Recv Transport 생성 중 방 ${roomId}를 찾을 수 없습니다.`);
      cb(null); return;
    }
    const currentRoom = rooms.get(roomId)!;
    const transport = await createWebRtcTransport(currentRoom.router); // 해당 룸의 라우터 사용
    const peer = currentRoom.peers.get(socket.id);
    if (peer) peer.recvTransport = transport;

    cb({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
  });

  socket.on("transport-connect", async ({ dtlsParameters }) => {
    const roomId = socketToRoom.get(socket.id);
    const transport = rooms.get(roomId!)?.peers.get(socket.id)?.sendTransport;
    if (transport) {
      await transport.connect({ dtlsParameters });
      console.log(`[Transport] 송신 Transport (${transport.id}) 연결 완료.`);
    }
  });

  socket.on("recv-transport-connect", async ({ dtlsParameters }, cb) => {
    const roomId = socketToRoom.get(socket.id);
    const transport = rooms.get(roomId!)?.peers.get(socket.id)?.recvTransport;
    if (transport) {
      await transport.connect({ dtlsParameters });
      console.log(`[Transport] 수신 Transport (${transport.id}) 연결 완료.`);
      cb?.(); // 콜백 호출하여 클라이언트에 연결 완료를 알림
    }
  });

  socket.on("transport-produce", async ({ kind, rtpParameters, appData }, cb) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId || !rooms.has(roomId)) {
      console.error(`[Producer] Producer 생성 중 방 ${roomId}를 찾을 수 없습니다.`);
      cb(null); return;
    }
    const currentRoom = rooms.get(roomId)!;
    const transport = currentRoom.peers.get(socket.id)?.sendTransport;

    if (!transport) {
      console.error(`[Producer] Socket ${socket.id}에 대한 송신 Transport가 없습니다.`);
      cb(null); return;
    }

    const producer = await transport.produce({ kind, rtpParameters, appData });
    const peer = currentRoom.peers.get(socket.id);
    if (peer) {
      peer.producers.set(producer.id, producer);
      console.log(`[Producer] Socket ${socket.id}가 Producer ${producer.id} (${kind}, ${appData.type})를 생성했습니다.`);
    }

    // Producer 종료 시 이벤트 처리
    producer.on("transportclose", () => {
      console.log(`[Producer] Producer ${producer.id}의 Transport가 종료되었습니다.`);
      if (peer) {
        peer.producers.delete(producer.id);
      }
      // 해당 방의 다른 모든 클라이언트에게 이 프로듀서가 종료되었음을 알림
      socket.to(roomId!).emit("producer-closed", producer.id);
    });

    // 현재 방의 다른 모든 클라이언트에게 새로운 프로듀서가 생겼음을 알림
    socket.to(roomId!).emit("new-producer", {
      producerId: producer.id,
      kind: producer.kind,
      appData: producer.appData,
      socketId: socket.id, // 이 프로듀서를 생성한 소켓의 ID
    });

    cb({ id: producer.id }); // 클라이언트에게 생성된 프로듀서 ID를 응답
  });

  socket.on("consume", async ({ producerId, rtpCapabilities }, cb) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId || !rooms.has(roomId)) {
      console.error(`[Consumer] Consumer 생성 중 방 ${roomId}를 찾을 수 없습니다.`);
      cb(null); return;
    }
    const currentRoom = rooms.get(roomId)!;
    const peer = currentRoom.peers.get(socket.id);
    const transport = peer?.recvTransport;

    // 현재 룸의 모든 피어에서 해당 producerId를 가진 프로듀서 찾기
    let producerToConsume: mediasoupTypes.Producer | undefined;
    for (const p of currentRoom.peers.values()) {
      if (p.producers.has(producerId)) {
        producerToConsume = p.producers.get(producerId);
        break;
      }
    }

    if (!producerToConsume || !transport || !peer) {
      console.error(`[Consumer] Consume 불가: Producer (${producerId}) 또는 Transport 없음.`);
      cb(null); return;
    }

    // 라우터가 클라이언트의 RTP Capabilities로 이 프로듀서를 소비할 수 있는지 확인
    if (!currentRoom.router.canConsume({ producerId, rtpCapabilities })) {
      console.error(`[Consumer] 라우터가 이 프로듀서(${producerId})를 클라이언트 RTP Capabilities로 소비할 수 없습니다.`);
      cb(null); return;
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false, // 처음부터 일시 중지하지 않고 시작
    });

    peer.consumers.set(consumer.id, consumer); // 컨슈머도 Map으로 저장

    console.log(`[Consumer] Socket ${socket.id}가 Producer ${producerId}를 소비합니다. Consumer ID: ${consumer.id}`);

    consumer.on("producerclose", () => {
      console.log(`[Consumer] Consumer ${consumer.id}의 Producer가 종료되었습니다.`);
      consumer.close();
      peer.consumers.delete(consumer.id);
      // 클라이언트에게 해당 컨슈머가 종료되었음을 알릴 필요가 있다면 여기에 로직 추가
      // socket.emit("consumer-closed", { consumerId: consumer.id });
    });
    consumer.on("transportclose", () => {
      console.log(`[Consumer] Consumer ${consumer.id}의 Transport가 종료되었습니다.`);
      consumer.close();
      peer.consumers.delete(consumer.id);
    });

    cb({
      id: consumer.id,
      producerId: producerToConsume.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      appData: producerToConsume.appData, // 프로듀서의 appData를 전달
    });
  });

  socket.on("close-producer", (producerId: string) => {
    const roomId = socketToRoom.get(socket.id);
    const peer = rooms.get(roomId!)?.peers.get(socket.id);
    const producer = peer?.producers.get(producerId);

    if (producer) {
      console.log(`[Producer] Socket ${socket.id}가 Producer ${producerId}를 명시적으로 닫습니다.`);
      producer.close(); // mediasoup producer 객체 닫기
      peer?.producers.delete(producerId); // 맵에서 삭제
      // 해당 방의 다른 모든 클라이언트에게 이 프로듀서가 종료되었음을 알림
      socket.to(roomId!).emit("producer-closed", producerId);
    }
  });

  socket.on("disconnect", () => {
    console.log('[Socket] 연결 해제됨:', socket.id);
    const roomId = socketToRoom.get(socket.id);
    if (!roomId || !rooms.has(roomId)) return;

    const currentRoom = rooms.get(roomId)!;
    const peer = currentRoom.peers.get(socket.id);

    if (peer) {
      // 이 피어의 모든 Transport와 Producer, Consumer를 닫습니다.
      peer.sendTransport?.close();
      peer.recvTransport?.close();

      peer.producers.forEach((producer) => {
        console.log(`[Disconnect] Producer ${producer.id} (소켓 ${socket.id}) 종료.`);
        producer.close();
        // 해당 방의 다른 모든 클라이언트에게 이 프로듀서가 종료되었음을 알립니다.
        socket.to(roomId).emit("producer-closed", producer.id);
      });
      peer.consumers.forEach((consumer) => {
        console.log(`[Disconnect] Consumer ${consumer.id} (소켓 ${socket.id}) 종료.`);
        consumer.close();
      });

      currentRoom.peers.delete(socket.id); // 룸의 피어 맵에서 제거
    }

    // 룸에 더 이상 피어가 없으면 룸의 라우터도 닫고 룸 맵에서 삭제
    if (currentRoom.peers.size === 0) {
      console.log(`[Room] 방 ${roomId}에 더 이상 피어가 없어 라우터를 닫고 룸을 삭제.`);
      currentRoom.router.close();
      rooms.delete(roomId);
    }
    socketToRoom.delete(socket.id); // socketToRoom 맵에서도 제거
  });
});

server.listen(PORT, async () => {
  await initMediasoupWorker(); // 서버 시작 시 워커만 초기화
  console.log(`Mediasoup 서버가 http://localhost:${PORT}에서 실행 중.`);
});