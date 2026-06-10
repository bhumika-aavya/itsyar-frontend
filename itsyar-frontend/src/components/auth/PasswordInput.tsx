import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full border rounded-lg p-3"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-3"
      >
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}