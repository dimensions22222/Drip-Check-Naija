import type { Character, Expression, Look, View } from "../avatar/catalog";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      player_profiles: {
        Row: { user_id: string; public_id: string; username: string; bio: string | null; country: string | null; level: number; xp: number; created_at: string; updated_at: string };
        Insert: { user_id: string; username: string; bio?: string | null; country?: string | null; level?: number; xp?: number; created_at?: string; updated_at?: string };
        Update: { user_id?: string; username?: string; bio?: string | null; country?: string | null; level?: number; xp?: number; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      avatars: {
        Row: { user_id: string; character_type: Character; appearance_config: Json; public_display: boolean; created_at: string; updated_at: string };
        Insert: { user_id: string; character_type: Character; appearance_config?: Json; public_display?: boolean; created_at?: string; updated_at?: string };
        Update: { user_id?: string; character_type?: Character; appearance_config?: Json; public_display?: boolean; created_at?: string; updated_at?: string };
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
      player_follows: {
        Row: { follower_id: string; following_id: string; created_at: string };
        Insert: { follower_id: string; following_id: string; created_at?: string };
        Update: { follower_id?: string; following_id?: string; created_at?: string };
        Relationships: [];
      };
      outfit_showcases: {
        Row: { id: string; owner_id: string; outfit_id: string; title: string; published_at: string };
        Insert: { id?: string; owner_id: string; outfit_id: string; title: string; published_at?: string };
        Update: { id?: string; owner_id?: string; outfit_id?: string; title?: string; published_at?: string };
        Relationships: [];
      };
      outfit_likes: {
        Row: { showcase_id: string; user_id: string; created_at: string };
        Insert: { showcase_id: string; user_id: string; created_at?: string };
        Update: { showcase_id?: string; user_id?: string; created_at?: string };
        Relationships: [];
      };
    };
    Views: {
      public_player_profiles: {
        Row: { public_id: string; username: string; bio: string | null; level: number; xp: number; avatar_character_type: Character | null; avatar_appearance_config: Json | null; follower_count: number; following_count: number; viewer_follows: boolean };
        Relationships: [];
      };
      public_outfit_showcases: {
        Row: { id: string; player_public_id: string; username: string; title: string; character_type: Character; equipped_items: Json; appearance_config: Json; published_at: string; like_count: number; viewer_liked: boolean };
        Relationships: [];
      };
    };
    Functions: {
      set_player_follow: { Args: { target_public_id: string; should_follow: boolean }; Returns: undefined };
      set_outfit_showcase_like: { Args: { target_showcase_id: string; should_like: boolean }; Returns: undefined };
      get_player_connections: { Args: { target_public_id: string; connection_type: string }; Returns: { public_id: string; username: string }[] };
      publish_outfit_showcase: { Args: { target_outfit_id: string; showcase_title: string }; Returns: string };
      remove_outfit_showcase: { Args: { target_showcase_id: string }; Returns: undefined };
      set_avatar_public_display: { Args: { should_be_public: boolean }; Returns: undefined };
      get_progression_dashboard: { Args: Record<string, never>; Returns: Json };
      record_progression_activity: { Args: { p_activity_type: string; p_reference_id?: string }; Returns: Json };
      claim_mission_reward: { Args: { p_mission_id: string }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CloudOutfit = Database["public"]["Tables"]["outfits"]["Row"];
