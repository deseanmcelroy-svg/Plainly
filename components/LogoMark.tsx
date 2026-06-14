interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** The Plainly icon mark: a flowing script "P" on a terracotta rounded square. */
export default function LogoMark({ size = 30, className = '' }: LogoMarkProps) {
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-lg bg-terracotta ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M 195 130 C 195 110, 210 100, 235 103 C 300 110, 340 142, 340 182 C 340 222, 300 248, 243 242 C 222 240, 208 235, 199 230 L 199 410 C 199 432, 186 445, 164 447 C 154 448, 145 447, 140 445"
          fill="none"
          stroke="#F7F4ED"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
