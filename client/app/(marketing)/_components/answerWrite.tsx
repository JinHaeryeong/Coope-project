"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FC, SetStateAction, useRef, useState } from "react";
import { BadgeX } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { sendEmail } from "@/lib/action";

interface AnswerWriteProps {
    inquiry: string;
    onClose: () => void;
    userEmail: string;
    userName: string;
}

export const AnswerWrite: FC<AnswerWriteProps> = ({ inquiry, onClose, userEmail, userName }) => {
    const [content, setContent] = useState(userName + "님, 안녕하세요☺️ 문의 주신 사항 답변 드립니다.");
    const { user } = useUser();
    const fileInput = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const answerInquiry = useMutation(api.inquiries.answerInquiry);
    const generateUploadUrl = useMutation(api.inquiries.generateUploadUrl); //convex에서 file을 저장하기 위해서 필요한 uploadUrl
    const inputComment = (e: { target: { value: SetStateAction<string>; }; }) => {
        setContent(e.target.value);
    }

    const handleAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (!user.username) {
            alert('유저가 존재하지 않습니다');
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

            const files = await Promise.all(fileUploadPromises);

            await answerInquiry({
                content,
                inquiryId: inquiry,
                files,
                authorId: user?.id
            })
            console.log(selectedFiles);
            //답변 등록될 때 답변이 mail로도 가도록 구현
            await sendEmail(userEmail, content);
            setContent('');
            setSelectedFiles([]);
            setPreviews([]);

            if (fileInput.current) {
                fileInput.current.value = '';
            }

            onClose();

        } catch (error) {
            console.error('답변 작성 중 오류 발생:', error);
            alert("답변 작성에 실패했습니다.");
        }
    }

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

    return (
        <div className="flex flex-col w-full space-y-2">
            <span>답변 작성시 주의사항</span>
            <span className="font-medium">- 발생 날짜, 시간에 대한 언급을 해야합니다.</span>
            <form onSubmit={handleAnswer} className="flex flex-col gap-2 w-full">
                <div className="h-full w-full">
                    <textarea
                        name="content"
                        value={content}
                        onChange={inputComment}
                        placeholder="답변을 입력해주세요"
                        required
                        className="h-full w-full comment-textarea font-medium"
                        style={{ height: '150px' }} // Adjust the height value here
                        maxLength={500}
                    />
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
                </div>
                <Button type="submit" className="h-full">등록</Button>
            </form>
            <div>
                {selectedFiles.map((file, index) => (
                    <div key={index} className="files-box text-gray-500">
                        <span className="mr-1 font-medium">{file.name}</span>
                        <button type="button" onClick={() => handleRemoveFile(index)}><BadgeX /></button>
                    </div>
                ))}
                <div className="previews">
                    {previews.map((preview, index) => (
                        <div key={index} className="preview-box">
                            <Image src={preview} alt={`Preview ${index}`} width="100" height="100" className="shadow-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AnswerWrite;
