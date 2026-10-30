import destinations from "./destinations.json";
import enterprises from "./enterprises.json";
import community from "./community_posts.json";
import type { Listing, Post } from "../lib/types";
export const seedListings = [...destinations, ...enterprises] as Listing[];
export const seedPosts = community as Post[];
