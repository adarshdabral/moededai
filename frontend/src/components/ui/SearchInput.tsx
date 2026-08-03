import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { Input } from './Input';

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="search" icon={<Search className="size-4" />} {...props} />;
}
