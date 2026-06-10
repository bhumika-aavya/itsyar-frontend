import { useForm } from "react-hook-form";

export default function RegisterForm() {

  const {
    register,
    handleSubmit,
  } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >

      <input
        {...register("fullName")}
        placeholder="Enter your full name"
        className="w-full border p-3 rounded-lg"
      />

      <input
        {...register("email")}
        placeholder="Enter your email"
        className="w-full border p-3 rounded-lg"
      />

      <input
        type="password"
        {...register("password")}
        placeholder="Password"
        className="w-full border p-3 rounded-lg"
      />

      <input
        type="password"
        {...register("confirmPassword")}
        placeholder="Confirm Password"
        className="w-full border p-3 rounded-lg"
      />

      <div className="flex gap-4">

        <label>
          <input
            type="radio"
            value="student"
            {...register("userType")}
          />
          Student
        </label>

        <label>
          <input
            type="radio"
            value="professional"
            {...register("userType")}
          />
          Working Professional
        </label>

        <label>
          <input
            type="radio"
            value="other"
            {...register("userType")}
          />
          Other
        </label>

      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-3 rounded-lg"
      >
        Create Learning Account
      </button>

    </form>
  );
}