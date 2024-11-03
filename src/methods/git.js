export async function fetchEvents () {
    const response = await fetch("https://api.github.com/users/skeltonmod/events");
    const data = await response.json();

    return data;
}