import type { Character, Expression, Look, View } from "../avatar/catalog";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      player_profiles: {
        Row: { user_id: string; username: string; bio: string | null; country: string | null; level: number; xp: number; created_at: string; updated_at: string };
        Insert: { user_id: string; username: string; bio?: string | null; country?: string | null; level?: number; xp?: number; created_at?: string; updated_at?: string };
        Update: { user_id?: string; username?: string; bio?: string | null; country?: string | null; level?: number; xp?: number; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      avatars: {
        Row: { user_id: string; character_type: Character; appearance_config: Json; created_at: string; updated_at: string };
        Insert: { user_id: string; character_type: Character; appearance_config?: Json; created_at?: string; updated_at?: string };
        Update: { user_id?: string; character_type?: Character; appearance_config?: Json; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      fashion_items: {
        Row: { id: string; slug: string; name: string; category: string; rarity: string; price: number; asset_path: string | null; thumbnail_path: string | null; metadata: Json; active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; category: string; rarity: string; price?: number; asset_path?: string | null; thumbnail_path?: string | null; metadata?: Json; active?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; slug?: string; name?: string; category?: string; rarity?: string; price?: number; asset_path?: string | null; thumbnail_path?: string | null; metadata?: Json; active?: boolean; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      player_inventory: {
        Row: { user_id: string; item_id: string; fashion_item_id: string; acquired_at: string; source: string };
        Insert: { user_id: string; item_id: string; fashion_item_id: string; acquired_at?: string; source?: string };
        Update: { user_id?: string; item_id?: string; fashion_item_id?: string; acquired_at?: string; source?: string };
        Relationships: [];
      };
      outfits: {
        Row: { id: string; user_id: string; name: string; character_type: Character; equipped_items: Json; appearance_config: Json; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; name: string; character_type: Character; equipped_items?: Json; appearance_config?: Json; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; name?: string; character_type?: Character; equipped_items?: Json; appearance_config?: Json; created_at?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CloudOutfit = Database["public"]["Tables"]["outfits"]["Row"];
