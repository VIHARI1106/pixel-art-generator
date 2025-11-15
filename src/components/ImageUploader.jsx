import React from 'react'

export default function ImageUploader({ onFile }) {
  return (
    <div className="p-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  )
}
