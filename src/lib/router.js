import Home from "../routes/Home.svelte";
import Blog from "../routes/Blog.svelte";
import NotFound from "../routes/NotFound.svelte";
import Post from "../routes/Post.svelte";
import Games from "../routes/Games.svelte";
import Work from "../routes/Work.svelte";
import Dtp from "../routes/games/dtp.svelte";
import BrannCom from "../routes/games/branncom.svelte";
import Apis from "../routes/games/apis.svelte";
import Shootyman from "../routes/games/shootyman.svelte";
import ShootyCrate from "../routes/games/scb.svelte";
import Pitch from "../routes/games/pitch.svelte";

export const routes = {
  // Exact path
  '/': Home,
  '/blog': Blog,
  '/post/:id': Post,
  "/games": Games,
  "/work": Work,
  "/games/dtp": Dtp,
  "/games/branncom": BrannCom,
  "/games/apis": Apis,
  "/games/shootyman": Shootyman,
  "/games/scb": ShootyCrate,
  "/games/pitch": Pitch,
  // This is optional, but if present it must be the last
  "*": NotFound,
}
