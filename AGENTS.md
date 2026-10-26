# Wordbook maintenance

This GitHub repository is the sole source of truth. Before modifying, read the latest main branch.

- Explain new words in chat first; update only after the user asks to save.
- Add complete entries in dist/data.js: word, ipa, pos, summary, meaning, etymology, collocations, example, translation, synonyms, exam.
- Add verified UK and US audio files under dist/audio/ and dist/audio/us/ and register bundled audio in dist/app.js if needed.
- Preserve current UI, theme, animations and scroll behavior unless the user explicitly asks for changes.
- Do not overwrite browser-local learning progress or promise cross-device sync.
- Run node --check on changed JavaScript. Check audio decodes.
- Commit to main; Netlify project jianguo-wordslist-129830 must deploy that commit successfully before reporting publication.
- Do not update the former ChatGPT Sites source as a second source of truth.
- Do not commit .netlify or credentials.
