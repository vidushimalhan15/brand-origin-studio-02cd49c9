
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Repeat, Globe, Plus } from "lucide-react";

interface PostMockupProps {
    type: "instagram" | "twitter" | "linkedin";
    content: string;
    image?: string;
    likes?: string;
    comments?: string;
    author?: string;
    handle?: string;
    imageClassName?: string;
}


export const PostMockup = ({ type, content, image, likes = "1.2k", comments = "45", author = "SocialFlo", handle = "@socialflo", imageClassName = "" }: PostMockupProps) => {
    if (type === "instagram") {
        return (
            <div className="bg-white text-black rounded-xl overflow-hidden shadow-xl border border-gray-200 max-w-[320px] font-sans">
                {/* Header */}
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-white p-[2px]">
                                <Avatar className="w-full h-full">
                                    <AvatarImage src="/placeholder-user.jpg" />
                                    <AvatarFallback>SF</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                        <span className="text-sm font-semibold">{handle}</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 cursor-pointer" />
                </div>

                {/* Image */}
                {image && (
                    <div className="bg-gray-100 aspect-square w-full flex items-center justify-center overflow-hidden">
                        {image === "true" ? (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-gray-400 text-xs">
                                Generated Image
                            </div>
                        ) : (
                            <img src={image} alt="Post content" className={`w-full h-full object-cover ${imageClassName}`} />

                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="p-3">
                    <div className="flex justify-between mb-2">
                        <div className="flex gap-4">
                            <Heart className="w-6 h-6 hover:text-red-500 cursor-pointer" />
                            <MessageCircle className="w-6 h-6 cursor-pointer" />
                            <Send className="w-6 h-6 cursor-pointer" />
                        </div>
                        <Bookmark className="w-6 h-6 cursor-pointer" />
                    </div>
                    <p className="font-semibold text-sm mb-1">{likes} likes</p>
                    <div className="text-sm">
                        <span className="font-semibold mr-2">{handle}</span>
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    if (type === "linkedin") {
        return (
            <div className="bg-white text-black rounded-xl shadow-lg border border-gray-200 max-w-[320px] font-sans overflow-hidden">
                {/* Header */}
                <div className="p-3 pb-2">
                    <div className="flex gap-3">
                        <Avatar className="w-12 h-12 rounded-none"> {/* LinkedIn often uses squareish or just standard */}
                            <AvatarImage src="/placeholder-user.jpg" className="object-cover" />
                            <AvatarFallback className="bg-blue-600 text-white font-bold">SF</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-[14px] truncate">{author}</span>
                                <div className="flex items-center gap-1 text-blue-600 font-semibold text-[13px] cursor-pointer hover:bg-blue-50 px-2 py-0.5 rounded transition-colors">
                                    <Plus className="w-3 h-3" />
                                    Follow
                                </div>
                            </div>
                            <p className="text-gray-500 text-[12px] truncate">Scaling Brands with AI 🚀</p>
                            <div className="flex items-center gap-1 text-gray-400 text-[12px]">
                                <span>2h • </span>
                                <Globe className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-3 pb-2">
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap mb-2">
                        {content}
                    </p>
                    <span className="text-blue-600 text-[13px] font-semibold cursor-pointer hover:underline">
                        #SocialGrowth #AI #Marketing
                    </span>
                </div>

                {/* Optional Image */}
                {image && (
                    <div className="w-full bg-gray-100 aspect-video flex items-center justify-center overflow-hidden border-t border-gray-100">
                        <img src={image} alt="Post content" className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Social Counts */}
                <div className="px-3 py-2 flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                        <div className="bg-blue-500 rounded-full p-0.5">
                            <ThumbsUp className="w-2 h-2 text-white fill-current" />
                        </div>
                        <div className="bg-red-500 rounded-full p-0.5">
                            <Heart className="w-2 h-2 text-white fill-current" />
                        </div>
                        <span className="ml-1 hover:text-blue-600 hover:underline cursor-pointer">{likes}</span>
                    </div>
                    <span className="hover:text-blue-600 hover:underline cursor-pointer">{comments} comments</span>
                </div>

                {/* Action Buttons */}
                <div className="px-1 py-1 flex items-center justify-between">
                    <button className="flex items-center gap-1.5 px-2 py-3 rounded-md hover:bg-gray-100 flex-1 justify-center transition-colors text-gray-600 group">
                        <ThumbsUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-semibold">Like</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-2 py-3 rounded-md hover:bg-gray-100 flex-1 justify-center transition-colors text-gray-600 group">
                        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-semibold">Comment</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-2 py-3 rounded-md hover:bg-gray-100 flex-1 justify-center transition-colors text-gray-600 group">
                        <Repeat className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-semibold">Repost</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-2 py-3 rounded-md hover:bg-gray-100 flex-1 justify-center transition-colors text-gray-600 group">
                        <Send className="w-5 h-5 group-hover:scale-110 transition-transform -rotate-45 translate-y-[-1px] translate-x-[1px]" />
                        <span className="text-[13px] font-semibold">Send</span>
                    </button>
                </div>
            </div>
        );
    }

    if (type === "twitter") {
        return (
            <div className="bg-black text-white rounded-xl p-4 shadow-xl border border-gray-800 max-w-[320px] font-sans">
                <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>SF</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[15px]">{author}</span>
                            <span className="text-gray-500 text-[14px]">{handle} · 2h</span>
                        </div>
                        <p className="text-[15px] mt-1 leading-normal whitespace-pre-wrap">{content}</p>

                        <div className="flex justify-between mt-3 text-gray-500 max-w-[80%]">
                            <MessageCircle className="w-4 h-4" />
                            <div className="flex items-center gap-1 group cursor-pointer hover:text-green-500">
                                {/* Retweet icon mock */}
                                <div className="w-4 h-4 rounded border border-current" />
                            </div>
                            <Heart className="w-4 h-4 hover:text-red-600" />
                            <div className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null;
};
