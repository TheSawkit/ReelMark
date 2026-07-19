export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '14.1';
	};
	public: {
		Tables: {
			episode_watches: {
				Row: {
					episode_number: number;
					id: string;
					season_number: number;
					tv_id: number;
					user_id: string;
					watched_at: string | null;
				};
				Insert: {
					episode_number: number;
					id?: string;
					season_number: number;
					tv_id: number;
					user_id: string;
					watched_at?: string | null;
				};
				Update: {
					episode_number?: number;
					id?: string;
					season_number?: number;
					tv_id?: number;
					user_id?: string;
					watched_at?: string | null;
				};
				Relationships: [];
			};
			friendships: {
				Row: {
					addressee_id: string;
					created_at: string;
					id: string;
					requester_id: string;
					status: string;
					updated_at: string;
				};
				Insert: {
					addressee_id: string;
					created_at?: string;
					id?: string;
					requester_id: string;
					status?: string;
					updated_at?: string;
				};
				Update: {
					addressee_id?: string;
					created_at?: string;
					id?: string;
					requester_id?: string;
					status?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			notification_dedup: {
				Row: {
					created_at: string;
					dedup_key: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					dedup_key: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					dedup_key?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			notification_preferences: {
				Row: {
					created_at: string;
					friend_accepted: boolean;
					friend_requests: boolean;
					new_episodes: boolean;
					suggestions: boolean;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					friend_accepted?: boolean;
					friend_requests?: boolean;
					new_episodes?: boolean;
					suggestions?: boolean;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					friend_accepted?: boolean;
					friend_requests?: boolean;
					new_episodes?: boolean;
					suggestions?: boolean;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			notifications: {
				Row: {
					created_at: string;
					episode_number: number | null;
					id: string;
					media_id: number | null;
					media_title: string | null;
					media_type: string | null;
					poster_path: string | null;
					read_at: string | null;
					season_number: number | null;
					sender_id: string;
					sender_username: string | null;
					type: string;
					url: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					episode_number?: number | null;
					id?: string;
					media_id?: number | null;
					media_title?: string | null;
					media_type?: string | null;
					poster_path?: string | null;
					read_at?: string | null;
					season_number?: number | null;
					sender_id: string;
					sender_username?: string | null;
					type: string;
					url?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string;
					episode_number?: number | null;
					id?: string;
					media_id?: number | null;
					media_title?: string | null;
					media_type?: string | null;
					poster_path?: string | null;
					read_at?: string | null;
					season_number?: number | null;
					sender_id?: string;
					sender_username?: string | null;
					type?: string;
					url?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			playlist_items: {
				Row: {
					added_at: string;
					genre_ids: number[] | null;
					id: string;
					media_id: number;
					media_title: string;
					media_type: string;
					playlist_id: string;
					poster_path: string | null;
					release_date: string | null;
				};
				Insert: {
					added_at?: string;
					genre_ids?: number[] | null;
					id?: string;
					media_id: number;
					media_title: string;
					media_type: string;
					playlist_id: string;
					poster_path?: string | null;
					release_date?: string | null;
				};
				Update: {
					added_at?: string;
					genre_ids?: number[] | null;
					id?: string;
					media_id?: number;
					media_title?: string;
					media_type?: string;
					playlist_id?: string;
					poster_path?: string | null;
					release_date?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'playlist_items_playlist_id_fkey';
						columns: ['playlist_id'];
						isOneToOne: false;
						referencedRelation: 'playlists';
						referencedColumns: ['id'];
					},
				];
			};
			playlists: {
				Row: {
					created_at: string;
					description: string | null;
					id: string;
					name: string;
					updated_at: string;
					user_id: string;
					visibility: string;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					id?: string;
					name: string;
					updated_at?: string;
					user_id: string;
					visibility?: string;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					id?: string;
					name?: string;
					updated_at?: string;
					user_id?: string;
					visibility?: string;
				};
				Relationships: [];
			};
			privacy_settings: {
				Row: {
					friends_visibility: string;
					playlists_visibility: string;
					reviews_visibility: string;
					user_id: string;
					watched_visibility: string;
					watchlist_visibility: string;
				};
				Insert: {
					friends_visibility?: string;
					playlists_visibility?: string;
					reviews_visibility?: string;
					user_id: string;
					watched_visibility?: string;
					watchlist_visibility?: string;
				};
				Update: {
					friends_visibility?: string;
					playlists_visibility?: string;
					reviews_visibility?: string;
					user_id?: string;
					watched_visibility?: string;
					watchlist_visibility?: string;
				};
				Relationships: [];
			};
			push_subscriptions: {
				Row: {
					auth: string;
					created_at: string;
					endpoint: string;
					id: string;
					p256dh: string;
					user_agent: string | null;
					user_id: string;
				};
				Insert: {
					auth: string;
					created_at?: string;
					endpoint: string;
					id?: string;
					p256dh: string;
					user_agent?: string | null;
					user_id: string;
				};
				Update: {
					auth?: string;
					created_at?: string;
					endpoint?: string;
					id?: string;
					p256dh?: string;
					user_agent?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			recommendation_dismissals: {
				Row: {
					created_at: string;
					genre_ids: number[];
					id: string;
					media_id: number;
					media_type: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					genre_ids?: number[];
					id?: string;
					media_id: number;
					media_type: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					genre_ids?: number[];
					id?: string;
					media_id?: number;
					media_type?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			reviews: {
				Row: {
					content: string | null;
					created_at: string;
					id: string;
					media_id: number;
					media_title: string;
					media_type: string;
					poster_path: string | null;
					rating: number | null;
					season_number: number | null;
					tv_id: number | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					content?: string | null;
					created_at?: string;
					id?: string;
					media_id: number;
					media_title: string;
					media_type: string;
					poster_path?: string | null;
					rating?: number | null;
					season_number?: number | null;
					tv_id?: number | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					content?: string | null;
					created_at?: string;
					id?: string;
					media_id?: number;
					media_title?: string;
					media_type?: string;
					poster_path?: string | null;
					rating?: number | null;
					season_number?: number | null;
					tv_id?: number | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			user_profiles: {
				Row: {
					avatar_url: string | null;
					bio: string | null;
					created_at: string;
					full_name: string | null;
					instagram: string | null;
					letterboxd: string | null;
					onboarding_completed: boolean;
					tiktok: string | null;
					twitter: string | null;
					updated_at: string;
					user_id: string;
					username: string;
					website: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string;
					full_name?: string | null;
					instagram?: string | null;
					letterboxd?: string | null;
					onboarding_completed?: boolean;
					tiktok?: string | null;
					twitter?: string | null;
					updated_at?: string;
					user_id: string;
					username: string;
					website?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string;
					full_name?: string | null;
					instagram?: string | null;
					letterboxd?: string | null;
					onboarding_completed?: boolean;
					tiktok?: string | null;
					twitter?: string | null;
					updated_at?: string;
					user_id?: string;
					username?: string;
					website?: string | null;
				};
				Relationships: [];
			};
			user_streaming_providers: {
				Row: {
					provider_ids: number[];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					provider_ids?: number[];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					provider_ids?: number[];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			watchlist: {
				Row: {
					created_at: string | null;
					genre_ids: number[] | null;
					id: string;
					media_id: number;
					media_title: string;
					media_type: string;
					poster_path: string | null;
					release_date: string | null;
					status: string;
					total_episodes: number | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					genre_ids?: number[] | null;
					id?: string;
					media_id: number;
					media_title: string;
					media_type?: string;
					poster_path?: string | null;
					release_date?: string | null;
					status: string;
					total_episodes?: number | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					genre_ids?: number[] | null;
					id?: string;
					media_id?: number;
					media_title?: string;
					media_type?: string;
					poster_path?: string | null;
					release_date?: string | null;
					status?: string;
					total_episodes?: number | null;
					user_id?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			episode_watch_counts: {
				Args: never;
				Returns: {
					tv_id: number;
					watched_count: number;
				}[];
			};
			get_episodes_rating: {
				Args: { p_episode_ids: number[] };
				Returns: {
					avg: number;
					count: number;
				}[];
			};
			get_media_rating: {
				Args: { p_media_id: number; p_media_type: string };
				Returns: {
					avg: number;
					count: number;
				}[];
			};
			get_public_episode_reviews: {
				Args: { p_episode_ids: number[]; p_viewer_id?: string };
				Returns: {
					avatar_url: string;
					content: string;
					created_at: string;
					id: string;
					media_id: number;
					rating: number;
					user_id: string;
					username: string;
				}[];
			};
			get_public_reviews: {
				Args: {
					p_media_id: number;
					p_media_type: string;
					p_viewer_id?: string;
				};
				Returns: {
					avatar_url: string;
					content: string;
					created_at: string;
					id: string;
					media_id: number;
					rating: number;
					user_id: string;
					username: string;
				}[];
			};
			get_season_rating: {
				Args: { p_season_number: number; p_tv_id: number };
				Returns: {
					avg: number;
					count: number;
				}[];
			};
			get_show_rating: {
				Args: { p_tv_id: number };
				Returns: {
					avg: number;
					count: number;
				}[];
			};
			sync_tv_watchlist_status: {
				Args: {
					p_poster?: string;
					p_title?: string;
					p_total: number;
					p_tv_id: number;
				};
				Returns: undefined;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	'public'
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
				DefaultSchema['Views'])
		? (DefaultSchema['Tables'] &
				DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never) = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
