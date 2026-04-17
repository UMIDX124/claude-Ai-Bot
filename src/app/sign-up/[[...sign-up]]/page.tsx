import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#F59E0B",
            colorBackground: "#0D0D0D",
            colorInputBackground: "#1F1F1F",
            colorText: "#FAFAFA",
            colorTextSecondary: "#A1A1AA",
            borderRadius: "0.75rem",
          },
          elements: {
            card: "bg-[#111111] border border-[#1F1F1F] shadow-2xl",
            headerTitle: "text-white",
            socialButtonsBlockButton: "border-[#1F1F1F] hover:bg-[#1F1F1F]",
          },
        }}
      />
    </div>
  );
}
