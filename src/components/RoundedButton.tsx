import type { RoundedButtonProps } from '@/types'

export const RoundedButton: React.FC<RoundedButtonProps> = ({
  onClick,
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="m-4 max-w-xs rounded-xl border border-gray-200 p-6 text-left text-inherit transition-colors hover:border-blue-600 hover:text-blue-600 focus:border-blue-600 focus:text-blue-600 active:border-blue-600 active:text-blue-600cursor-pointer border-solid dark:border-white/[.145] flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
  >
    {title}
  </button>
);
