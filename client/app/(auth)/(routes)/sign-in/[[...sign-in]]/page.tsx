import { SignIn } from "@clerk/nextjs";

//session 및 inactivity timeout clerk에서 설정 가능
export default function Page() {
    return <SignIn />;
}
