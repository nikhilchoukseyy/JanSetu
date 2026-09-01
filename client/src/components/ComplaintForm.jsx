import { useState } from "react";

export default function ComplaintForm({ onSubmit }) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe the issue..."
        className="border rounded-md p-3 w-full min-h-[120px]"
      />
      <button
        onClick={() => onSubmit(text)}
        className="bg-emerald-700 text-white rounded-md py-2"
      >
        Submit
      </button>
    </div>
  );
}