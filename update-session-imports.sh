#!/bin/bash

# Script to update components from useSessionStore to useAuth

echo "🔄 Updating session store imports..."

# Find all TypeScript/JSX files that import useSessionStore
files=$(grep -r "useSessionStore" src/ --include="*.ts" --include="*.tsx" -l | grep -v "session.ts" | grep -v "useAuth.ts")

for file in $files; do
    echo "📝 Processing: $file"
    
    # Replace the import statement
    sed -i.bak 's/import { useSessionStore } from "@\/store\/session";/import { useAuth } from "@\/hooks\/useAuth";/g' "$file"
    
    # Replace useSessionStore() calls with useAuth()
    sed -i.bak 's/useSessionStore(/useAuth(/g' "$file"
    
    # Replace common destructuring patterns
    sed -i.bak 's/initialize,/\/\/ initialize is automatic,/g' "$file"
    sed -i.bak 's/initialize /\/\/ initialize is automatic /g' "$file"
    
    # Remove manual initialization effects
    sed -i.bak '/useEffect(() => {/,/}, \[initialize\]);/{
        s/useEffect(() => {/\/\/ Session is automatically initialized by useAuth hook/
        s/initialize();/\/\/ No manual initialization needed/
        s/}, \[initialize\]);/\/\//
    }' "$file"
    
    # Clean up backup files
    rm -f "$file.bak"
    
    echo "✅ Updated: $file"
done

echo "🎉 All components updated!"
echo ""
echo "Next steps:"
echo "1. Test your app to ensure authentication works"
echo "2. Check for any TypeScript errors"
echo "3. Remove any remaining manual 'initialize()' calls"
echo "4. Replace 'isLoading' checks with 'isInitialized' where appropriate" 