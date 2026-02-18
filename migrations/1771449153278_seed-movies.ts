import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
export const shorthands: ColumnDefinitions | undefined = undefined;



const movies = [
    {
        title: "Utshob",
        description: "A man with several regrets attempts to reconcile with various decisions and incidents that occurred in his past with his family's help.",
        durationMinutes: 112,
        genre: "drama",
        posterUrl: "https://upload.wikimedia.org/wikipedia/en/1/18/Utshob_2025_film_poster.jpg",
        status: "now_showing",
    },
    {
        title: "Surongo",
        description: "A simple village electrician turns to crime and goes to extreme lengths to satisfy the needs of his beautiful, but greedy wife.",
        durationMinutes: 130,
        genre: "thriller",
        posterUrl: "https://upload.wikimedia.org/wikipedia/en/1/10/Surongo.jpeg",
        status: "now_showing",
    },
]

export async function up(pgm: MigrationBuilder): Promise<void> {
    for (const movie of movies) {
        pgm.sql(`
            INSERT INTO movies (title, description, duration_minutes, genre, poster_url, status)
            VALUES (
                '${movie.title}',
                '${movie.description.replace(/'/g, "''")}',
                ${movie.durationMinutes},
                '${movie.genre}',
                '${movie.posterUrl}',
                '${movie.status}'
            )
        `);
    }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    const titles = movies.map((m) => `'${m.title}'`).join(', ');
    pgm.sql(`DELETE FROM movies WHERE title IN (${titles});`);
}
