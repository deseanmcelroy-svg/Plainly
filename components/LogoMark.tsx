interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** The Plainly icon mark: a looping script "P" with an inner swash, on a terracotta rounded square. */
export default function LogoMark({ size = 30, className = '' }: LogoMarkProps) {
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-lg bg-terracotta ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M 170 165 C 170 120, 210 90, 262 92 C 330 95, 378 145, 378 205 C 378 268, 328 312, 262 308 C 222 306, 192 290, 175 268"
          fill="none"
          stroke="#F7F4ED"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="250" cy="222" rx="52" ry="24" fill="none" stroke="#F7F4ED" strokeWidth="24" />
        <path
          d="M 198 222 L 198 380 C 198 408, 180 423, 155 425 C 144 426, 134 424, 128 421"
          fill="none"
          stroke="#F7F4ED"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
