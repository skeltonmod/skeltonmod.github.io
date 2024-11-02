export async function fetchPosts() {
    const response = await fetch('https://sckickar.github.io/feed.xml');
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    const entries = xml.getElementsByTagName('entry');

    const posts = Array.from(entries).map(entry => ({
        id: entry.getElementsByTagName('id')[0].textContent.split('/').pop().toLowerCase(),
        title: entry.getElementsByTagName('title')[0].textContent,
        link: entry.getElementsByTagName('link')[0].getAttribute('href'),
        content: entry.getElementsByTagName('content')[0].textContent,
        published: entry.getElementsByTagName('published')[0].textContent,
        updated: entry.getElementsByTagName('updated')[0].textContent,
        category: entry.getElementsByTagName('category')[0].getAttribute('term')
    }));

    return posts;
}

export function postsByCategory(posts) {
    return posts.reduce((acc, post) => {
        if (!acc[post.category]) {
            acc[post.category] = [];
        }
        acc[post.category].push(post);
        return acc;
    }, {});
}

export async function viewPost(id){
    const posts = await fetchPosts();

    return posts.find(post => post.id === id);
}
