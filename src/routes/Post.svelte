<script>
  import { onMount } from "svelte";
  import { viewPost } from "../methods/posts";

    export let params;

    let post = {};

    const id = params.id;

    onMount(async () => {
        post = await viewPost(id);
        console.log(post);
    });
</script>

<div>
    <strong>{post.title}</strong>
    <div class="post-content">
        {@html post.content}
    </div>
</div>

<style>
    .post-content {
        max-height: 500px;
        overflow-y: auto;
        padding: 10px;
        word-wrap: break-word;
        line-height: 1.6;
        background-color: #FFF;
        border-radius: 2px;
        border: 1px solid #000;
    }
</style>
