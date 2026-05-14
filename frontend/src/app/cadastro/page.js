import AuthLayout from "@/components/layout/AuthLayout";
import RegisterForm from "@/components/forms/RegisterForm";

export default function CadastroPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}