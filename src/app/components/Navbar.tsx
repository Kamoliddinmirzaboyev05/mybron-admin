import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export default function Navbar() {
  const { user, signOut } = useAuth();
  
  if (!user) return null;

  const { full_name, avatar_url, picture, name: googleName } = user.user_metadata || {};
  const avatar = avatar_url || picture;
  const displayName = full_name || googleName || user.email?.split('@')[0] || 'Admin';

  return (
    <nav className="h-16 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between sticky top-0 z-40">
       <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
            <img src="/bronlogo.png" alt="Logo" className="w-full h-full object-cover" />
         </div>
         <span className="text-white font-bold text-lg hidden sm:block">MyBron Admin</span>
       </div>
       
       <div className="flex items-center gap-4">
         <div className="hidden md:flex flex-col items-end">
           <span className="text-sm font-medium text-white">{displayName}</span>
           <span className="text-xs text-zinc-400">{user.email}</span>
         </div>
         
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-offset-zinc-950 focus-visible:ring-zinc-800">
               <Avatar className="h-9 w-9 border border-zinc-700">
                 <AvatarImage src={avatar} alt={displayName} />
                 <AvatarFallback className="bg-zinc-800 text-zinc-400">
                   {displayName.charAt(0).toUpperCase()}
                 </AvatarFallback>
               </Avatar>
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200" align="end">
             <DropdownMenuLabel className="text-zinc-400">Hisobim</DropdownMenuLabel>
             <DropdownMenuSeparator className="bg-zinc-800" />
             <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer" onClick={() => signOut()}>
               <LogOut className="mr-2 h-4 w-4" />
               <span>Chiqish</span>
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
    </nav>
  );
}
