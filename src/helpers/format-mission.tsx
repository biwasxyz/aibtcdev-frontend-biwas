interface FormatMissionProps {
  content: string;
}

export function FormatMission({ content }: FormatMissionProps) {
  // Parse the content
  const sections = parseContent(content);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {sections.map((section, index) => (
        <div key={index} className="mb-8">
          {section.title && (
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {section.title}
            </h2>
          )}

          {section.paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}

          {section.listItems.length > 0 && (
            <ol className="list-decimal pl-6 mt-4 space-y-3">
              {section.listItems.map((item, lIndex) => (
                <li key={lIndex} className="text-gray-700">
                  <span className="font-semibold">{item.title}</span>
                  {item.description && ": "}
                  {item.description}
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}

interface Section {
  title: string | null;
  paragraphs: string[];
  listItems: {
    title: string;
    description: string | null;
  }[];
}

function parseContent(content: string): Section[] {
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  const sections: Section[] = [];
  let currentSection: Section = {
    title: null,
    paragraphs: [],
    listItems: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if it's a heading (starts with # or ##)
    if (line.startsWith("# ") || line.startsWith("## ")) {
      // If we already have content in the current section, push it and create a new one
      if (
        currentSection.title ||
        currentSection.paragraphs.length ||
        currentSection.listItems.length
      ) {
        sections.push(currentSection);
        currentSection = {
          title: null,
          paragraphs: [],
          listItems: [],
        };
      }

      currentSection.title = line.replace(/^#+ /, "");
    }
    // Check if it's a numbered list item
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s+(.*?):\s*(.*)$/);

      if (match) {
        // It has a title and description format like "1. Title: Description"
        currentSection.listItems.push({
          title: match[2],
          description: match[3],
        });
      } else {
        // It's just a simple list item
        const simpleMatch = line.match(/^\d+\.\s+(.*)$/);
        if (simpleMatch) {
          currentSection.listItems.push({
            title: simpleMatch[1],
            description: null,
          });
        }
      }
    }
    // Regular paragraph
    else {
      currentSection.paragraphs.push(line);
    }
  }

  // Don't forget to add the last section
  if (
    currentSection.title ||
    currentSection.paragraphs.length ||
    currentSection.listItems.length
  ) {
    sections.push(currentSection);
  }

  return sections;
}
