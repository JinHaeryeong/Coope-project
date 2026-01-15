"use client"

import React, { useRef, useState } from "react";
import EmojiPicker from 'emoji-picker-react';
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
/* 
  글쓰기 UI 좀 더 고민해보기
*/

const NewPost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { user } = useUser();
  const [open, setOpen] = useState(false); //emoji picker 
  const createNotice = useMutation(api.notices.createNotice);
  const router = useRouter(); //route 사용
  const generateUploadUrl = useMutation(api.notices.generateUploadUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!user.username) {
      alert('유저가 존재하지 않습니다.')
      return;
    } //user.fullName이 null인 경우를 처리해 주지 않으면 오류남

    /*file storage 기능은 convex 공식문서를 참고, 이 기능이 베타 버전이라 공식 문서와 convex에서 제공하는 ai 밖에 참고할 게 없음
    file 저장방식 http action으로 변경이 필요할 수 있음 => 우선 업로드 url을 통한 방식으로 만들었지만 
    기존 파일 이름 등 유지를 위해 변경이 필요
    */
    try {
      let storageId;
      let fileFormat;
      let fileName;
      if (selectedFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId: uploadedStorageId } = await result.json();
        fileFormat = selectedFile!.type;
        storageId = uploadedStorageId;
        fileName = selectedFile!.name;
      }
      await createNotice({
        title,
        content,
        author: user.username,
        storageId,
        fileFormat,
        fileName,
        authorId: user.id
      });
      setTitle('');
      setContent('');
      setSelectedFile(null);
      if (fileInput.current) {
        fileInput.current.value = '';
      }
      router.push('/notice');
    } catch (error) {
      console.error('공지사항 작성 중 오류 발생:', error);
      alert("공지사항 작성에 실패했습니다.");
    }
  }

  const handleEmojiPicker = () => {
    setOpen(!open);
  }

  //취소 클릭시 공지사항 페이지로 돌아갈 수 있도록
  const redirectNotices = () => {
    router.push('/notice');
  };

  const handleContnetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }

  const handleEmojiClick = (emojiObject: { emoji: string; }) => {
    setContent(prevContent => {
      const maxLength = 500;
      const emojiLength = 2;
      if (prevContent.length <= maxLength || (prevContent.length >= maxLength && prevContent.length + emojiObject.emoji.length <= maxLength + emojiLength)) {
        return prevContent + emojiObject.emoji;
      }
      else {
        return prevContent;
      }
    });
  }


  return (
    <div className="w-11/12 justify-center mx-auto my-10">
      <div className="heading text-center font-bold text-5xl m-5">공지사항</div>
      <form onSubmit={handleSubmit} className="editor mx-auto w-full flex flex-col text-gray-800 border border-gray-300 p-4 shadow-lg  rounded-lg">
        <input
          className="title bg-gray-100 border border-gray-300 p-2 mb-4 outline-none"
          placeholder="제목"
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="description bg-gray-100 sec p-3 h-96 border border-gray-300 outline-none resize-none"
          placeholder="내용을 입력하세요."
          name="content"
          value={content}
          onChange={handleContnetChange}
          required
          maxLength={500}
        />

        {/* icons */}
        <div className="icons flex text-gray-500 m-2">
          <svg onClick={handleEmojiPicker} className="mr-2 cursor-pointer hover:text-gray-700 border rounded-full p-1 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="file"
            ref={fileInput}
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            className="hidden"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            <svg className="mr-2 hover:text-gray-700 border rounded-full p-1 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>
          {selectedFile && <span className="text-sm text-gray-500 pt-1">{selectedFile.name}</span>}
          <div className="count ml-auto text-gray-400 text-xs font-semibold">최대 입력 가능 500자</div>

        </div>
        <EmojiPicker open={open} onEmojiClick={handleEmojiClick} />


        {/* buttons */}
        <div className="buttons flex">
          <Button type="button" variant="secondary" className="btn border border-gray-300 p-1 px-4 font-semibold cursor-pointer ml-auto rounded-md" onClick={redirectNotices}>취소</Button>
          <Button type="submit" className="btn border  p-1 px-4 font-semibold cursor-pointer rounded-md">게시</Button>
        </div>
      </form>
    </div>
  );
};

export default NewPost;