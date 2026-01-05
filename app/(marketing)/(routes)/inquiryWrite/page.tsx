"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BadgeX } from 'lucide-react';
import Image from "next/image";
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import React from "react";
const InquiryWrite = () => {

  const [title, setTitle] = useState("");
  const router = useRouter();
  const [content, setContent] = useState("");
  const { user } = useUser();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const generateUploadUrl = useMutation(api.inquiries.generateUploadUrl); //convex에서 file을 저장하기 위해서 필요한 uploadUrl
  const createInquiry = useMutation(api.inquiries.createInquiry); //작성된 문의 사항 저장을 위한 쿼리문
  const [category, setCategory] = useState("기타");
  const [environment, setEnvironment] = useState("PC");
  const userRole = user?.publicMetadata?.role
  //console.log(selectedFiles); //파일들 맞게 들어가는지 확인용

  //취소 클릭시 redirect 시키기
  const redirectCS = () => {
    if (userRole !== 'admin') {
      router.push('/customerService');
    }
    else {
      router.push('/csAdmin');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 3;
    const maxFileSizeMB = 20;


    const validFiles: File[] = [];
    let totalFiles = selectedFiles.length;

    for (const file of files) {
      if (file.size / 1024 / 1024 > maxFileSizeMB) {
        alert(`${file.name} 파일은 20MB를 초과합니다.`);
        continue;
      }
      if (totalFiles >= maxFiles) {
        alert(`파일은 최대 ${maxFiles}개까지 선택할 수 있습니다.`);
        break;
      }

      validFiles.push(file);
      totalFiles++;
    }

    setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);

    validFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviews(prevPreviews => [...prevPreviews, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };


  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setPreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      alert('문의를 작성하기 위해선 로그인이 필요합니다.');
      return;
    }
    if (!user.username) {
      alert('유저가 존재하지 않습니다.');
      return;
    }

    try {
      const fileUploadPromises = selectedFiles.map(async (file) => {
        const postUrl = await generateUploadUrl();
        const response = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await response.json();
        return {
          storageId,
          fileName: file.name,
        };
      });

      // 모든 파일 업로드가 완료될 때까지 기다림
      const files = await Promise.all(fileUploadPromises);

      // 게시글(문의)과 파일 정보를 함께 저장
      await createInquiry({
        title,
        content,
        userId: user.id,
        userName: user.username,
        userEmail: user.emailAddresses[0].emailAddress,
        category,
        environment,
        files,
      });

      setTitle('');
      setContent('');
      setSelectedFiles([]);
      setPreviews([]);

      if (fileInput.current) {
        fileInput.current.value = '';
      }

      if (userRole !== 'admin') {
        router.push('/customerService')
      } else {
        router.push('/csAdmin');
      }
    } catch (error: unknown) { // any 대신 unknown
      console.error('문의 작성 중 오류 발생:', error);
      if (error instanceof Error) {
        console.log("메시지:", error.message);
      }
      alert("문의 작성에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="heading text-center font-bold text-4xl m-5">문의</div>
      <form onSubmit={handleSubmit} className="editor mx-auto w-10/12 flex flex-col border border-gray-300 p-4 shadow-lg max-w-2xl rounded-lg">
        <input
          className="title border border-gray-300 p-2 mb-4 outline-none font-medium"
          placeholder="제목"
          type="text"
          name="title"
          value={title}
          onChange={handleTitleChange}
          required
        />
        <span className="font-normal">문의 유형</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{category}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>문의 유형</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={category} onValueChange={setCategory}>
              <DropdownMenuRadioItem value="계정문의">계정 문의</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="오류문의">오류 문의</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="건의사항">건의사항</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="기타">기타</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>

        </DropdownMenu>
        <span className="font-normal mt-2">발생 환경</span>
        <RadioGroup defaultValue={environment} className="grid-col-2 w-1/5 mb-2" onValueChange={setEnvironment}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="모바일" id="r1" />
            <Label htmlFor="r1">모바일</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="PC" id="r2" />
            <Label htmlFor="r2">PC</Label>
          </div>
        </RadioGroup>
        <span className="font-light text-base">- 오류가 발생한 상황(발생 시각 등)이나, 궁금한 사항에 대해 상세하게 작성해주세요</span>
        <span className="font-light text-base">- 상황에 대한 스크린샷을 함께 첨부해주시면 답변에 큰 도움이 됩니다</span>
        <span className="font-light text-base">- 답변은 문의내 갱신될 뿐만 아니라, 메일로 함께 전송됩니다</span>
        <textarea
          className="description sec mt-4 p-3 h-60 border border-gray-300 outline-none resize-none font-medium"
          placeholder="문의 내용을 입력하세요."
          name="content"
          value={content}
          onChange={handleContentChange}
          required
          maxLength={500}
        />

        <div className="icons flex text-gray-500 m-2">
          <input
            type="file"
            ref={fileInput}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            id="fileInput"
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            <svg className="mr-2 hover:text-gray-700 border rounded-full p-1 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>
          <div className="count ml-auto text-gray-400 text-xs font-semibold">최대 입력 가능 500자</div>
        </div>
        {selectedFiles.map((file, index) => (
          <div key={index} className="files-box text-gray-500">
            <span className="mr-1 font-medium">{file.name}</span>
            <button type="button" onClick={() => handleRemoveFile(index)}><BadgeX /></button>
          </div>
        ))}
        <div className="previews">
          {/* image 파일들의 미리보기를 지원*/}
          {previews.map((preview, index) => (
            <div key={index} className="preview-box">
              <Image src={preview} alt={`Preview ${index}`} width="100" height="100" className="shadow-lg" />
            </div>
          ))}
        </div>

        <div className="buttons flex">
          <Button type="button" variant="secondary" className="btn border border-gray-300 p-1 px-4 font-semibold cursor-pointer ml-auto rounded-md" onClick={redirectCS}>취소</Button>
          <Button type="submit" className="btn border p-1 px-4 font-semibold cursor-pointer rounded-md">게시</Button>
        </div>
      </form>
    </div>
  );
};

export default InquiryWrite;
