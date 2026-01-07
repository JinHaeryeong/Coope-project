import {create} from 'zustand'

type InviteStore = {
  isOpen:boolean
  onOpen:() => void
  onClose:() => void
}

export const useInvite = create<InviteStore>((set) => ({
  isOpen:false,
  onOpen:() => set({isOpen:true}),
  onClose:() => set({isOpen:false})
}))