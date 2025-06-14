import 'dotenv/config';
import { Client } from "@notionhq/client";

/**
 * Parses inline markdown formatting into Notion's rich_text format.
 * Ensures that the returned array is not empty if the text has content.
 * @param {string} text The text to parse.
 * @returns {Array<object>} An array of Notion rich_text objects.
 */
function parseInline(text) {
    if (!text || !text.trim()) {
        return [];
    }

    const pattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
    const parts = text.split(pattern);
    const rich = [];

    for (const p of parts) {
        if (!p) continue;

        const annotations = {
            bold: false, italic: false, underline: false,
            strikethrough: false, code: false, color: "default",
        };
        let content = p;

        if (p.startsWith("**") && p.endsWith("**")) {
            annotations.bold = true;
            content = p.substring(2, p.length - 2);
        } else if (p.startsWith("__") && p.endsWith("__")) {
            annotations.underline = true;
            content = p.substring(2, p.length - 2);
        } else if (p.startsWith("~~") && p.endsWith("~~")) {
            annotations.strikethrough = true;
            content = p.substring(2, p.length - 2);
        } else if ((p.startsWith("*") && p.endsWith("*") && !p.startsWith("**")) || (p.startsWith("_") && p.endsWith("_") && !p.startsWith("__"))) {
            annotations.italic = true;
            content = p.substring(1, p.length - 1);
        } else if (p.startsWith("`") && p.endsWith("`")) {
            annotations.code = true;
            content = p.substring(1, p.length - 1);
        }

        if (content) { // Only push if there is actual content
            rich.push({
                type: "text",
                text: { content: content },
                annotations: annotations,
            });
        }
    }
    return rich;
}

/**
 * Converts a markdown string into an array of Notion block objects.
 * This version includes robust checks to prevent creating empty or invalid blocks.
 * @param {string} md The markdown string.
 * @returns {Array<object>} An array of Notion block objects.
 */
function mdToBlocks(md) {
    const lines = md.split('\n');
    const blocks = [];
    let i = 0;

    const bullet_re = /^\s*[\*\-\+]\s+/;
    const ordered_re = /^\s*\d+\.\s+/;
    const divider_re = /^\s*(\*\*\*+|---+|___+)\s*$/;

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Code blocks
        if (trimmedLine.startsWith("```")) {
            const lang = trimmedLine.substring(3).trim() || "plain text";
            const code_lines = [];
            i++;
            while (i < lines.length && !lines[i].trim().endsWith("```")) {
                code_lines.push(lines[i]);
                i++;
            }
            if (code_lines.length > 0) {
                blocks.push({
                    object: "block", type: "code",
                    code: { language: lang, rich_text: [{ type: "text", text: { content: code_lines.join("\n") } }] }
                });
            }
        }
        // Tables
        else if (trimmedLine.startsWith('|')) {
            const tableRows = [];
            let hasHeader = false;
            // Collect all consecutive table lines
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                const rowLine = lines[i].trim();
                // Check for markdown table header separator
                if (/^\s*\|\s*---\s*\|/.test(rowLine)) {
                    hasHeader = true;
                } else {
                    const cells = rowLine.split('|').slice(1, -1).map(cell => {
                        const richText = parseInline(cell.trim());
                        // Notion requires at least one rich text object, even if empty
                        return richText.length > 0 ? richText : [{ type: 'text', text: { content: ' ' } }];
                    });
                    tableRows.push({ type: 'table_row', table_row: { cells } });
                }
                i++;
            }
            if (tableRows.length > 0) {
                const tableWidth = Math.max(...tableRows.map(row => row.table_row.cells.length));
                blocks.push({
                    object: 'block',
                    type: 'table',
                    table: {
                        table_width: tableWidth,
                        has_column_header: hasHeader,
                        has_row_header: false,
                        children: tableRows
                    }
                });
            }
            i--; // Decrement because the outer loop will increment
        }
        // Dividers
        else if (divider_re.test(trimmedLine)) {
            blocks.push({ object: "block", type: "divider", divider: {} });
        }
        // Headings
        else if (trimmedLine.startsWith("#")) {
            const level = Math.min(3, trimmedLine.match(/^#+/)[0].length);
            const txt = trimmedLine.replace(/^#+\s*/, '');
            const richText = parseInline(txt);
            if (richText.length > 0) {
                const headingType = `heading_${level}`;
                blocks.push({
                    object: "block", type: headingType,
                    [headingType]: { rich_text: richText }
                });
            }
        }
        // Lists
        else if (bullet_re.test(trimmedLine) || ordered_re.test(trimmedLine)) {
            const isOrdered = ordered_re.test(trimmedLine);
            const item_text = trimmedLine.replace(isOrdered ? ordered_re : bullet_re, "");
            const richText = parseInline(item_text);
            if (richText.length > 0) {
                const listItemType = isOrdered ? "numbered_list_item" : "bulleted_list_item";
                blocks.push({
                    object: "block",
                    type: listItemType,
                    [listItemType]: { rich_text: richText }
                });
            }
        }
        // Paragraphs (Fallback)
        else if (trimmedLine) {
            const richText = parseInline(trimmedLine);
            if (richText.length > 0) {
                blocks.push({
                    object: "block", type: "paragraph",
                    paragraph: { rich_text: richText }
                });
            }
        }
        i++;
    }
    return blocks.filter(block => block && block.type);
}

/**
 * Parses the NOTION_PAGE_LIST from .env into a selectable list.
 * @returns {Array<object>} A list of page objects, each with an id and title.
 */
function getSelectablePages() {
    const pageListString = process.env.NOTION_PAGE_LIST;
    if (!pageListString) {
        console.warn("[Notion Module] WARNING: NOTION_PAGE_LIST environment variable not found or is empty. Check your .env file and PM2 configuration.");
        return [];
    }

    try {
        const pages = pageListString.split(',').map(pair => {
            const [title, id] = pair.split(':');
            if (!title || !id) {
                throw new Error(`Invalid entry in NOTION_PAGE_LIST: "${pair}"`);
            }
            return { title: title.trim(), id: id.trim() };
        });
        return pages;
    } catch (error) {
        console.error("Error parsing NOTION_PAGE_LIST:", error);
        return []; // Return empty array on parsing error
    }
}

/**
 * Creates a new Notion page with markdown content.
 * @param {string} title - The title of the new page.
 * @param {string} markdownContent - The markdown content to add to the page.
 * @param {string} parentId - The ID of the page to add the new page to.
 * @returns {Promise<object>} The created page object.
 */
async function createNotionPageFromMarkdown({ title, markdownContent, parentId }) {
    const apiKey = process.env.NOTION_API_KEY;

    if (!apiKey || !parentId || !title) {
        throw new Error("apiKey, parentId, and title are required.");
    }

    const notion = new Client({ auth: apiKey });
    const BATCH_SIZE = 100;

    try {
        const allBlocks = mdToBlocks(markdownContent);

        if (allBlocks.length === 0 && title) {
             console.log(`Content for "${title}" was empty or invalid, creating a page with only a title.`);
        }

        const firstBatch = allBlocks.slice(0, BATCH_SIZE);

        const newPage = await notion.pages.create({
            parent: { page_id: parentId },
            properties: {
                title: {
                    title: [{ type: "text", text: { content: title } }],
                },
            },
            children: firstBatch,
        });

        if (allBlocks.length > BATCH_SIZE) {
            for (let i = BATCH_SIZE; i < allBlocks.length; i += BATCH_SIZE) {
                const batch = allBlocks.slice(i, i + BATCH_SIZE);
                await notion.blocks.children.append({
                    block_id: newPage.id,
                    children: batch,
                });
            }
        }
        
        console.log(`Successfully created page "${title}"`);
        return newPage;

    } catch (error) {
        console.error("Error creating Notion page:", error.body || error);
        throw error;
    }
}

export { createNotionPageFromMarkdown, mdToBlocks, parseInline, getSelectablePages };
