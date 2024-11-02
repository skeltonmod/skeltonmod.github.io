<script>
  import { fetchPosts, postsByCategory } from "../methods/posts";
  import {push, pop, replace} from 'svelte-spa-router'
  import { onMount } from "svelte";

  let posts = [];

  onMount(async () => {
    const response = await fetchPosts();
    posts = postsByCategory(response);
  });

  const viewPost = (post) => {
    push(`/post/${post.id}`);
  }
</script>

<div>
  <ul class="tree-view">
    {#each Object.entries(posts) as [category, categoryPosts]}
      <li>
        <span>{category}</span>
        <ul>
          {#each categoryPosts as post}
            <li>
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span style="cursor: pointer" on:click={() => viewPost(post)}
                >{post.title}</span
              >
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
</div>
