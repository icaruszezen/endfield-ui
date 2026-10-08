/** 演示用的原创等距线稿：黑线白面的一摞方块。纯装饰。 */
export function IsoCube({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="#ffffff"
      stroke="#191919"
      strokeWidth={1.5}
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M36 34 60 46 36 58 12 46z" />
      <path d="M12 46v8l24 12V58zM60 46v8L36 66V58z" />
      <path d="M36 12 54 21 36 30 18 21z" />
      <path d="M18 21v18l18 9V30zM54 21v18l-18 9V30z" />
    </svg>
  );
}
