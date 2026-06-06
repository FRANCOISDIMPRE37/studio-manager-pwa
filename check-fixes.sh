#!/bin/bash
echo "🔍 Vérification des fixes critiques..."

# Fix dateSigned lignes 518 et 522
if grep -q "dateSignd\|dateSigne\b\|undefinedd" client/src/pages/DocumentForm.tsx; then
  echo "❌ Fix dateSigned manquant - correction automatique..."
  sed -i '518s/.*/        dateSigned: isSigned ? dateShort : (existingDoc ? (existingDoc.dateSigned ?? undefined) : undefined),/' client/src/pages/DocumentForm.tsx
  sed -i '522s/.*/        dateSigned: isSigned ? dateShort : (existingDoc ? (existingDoc.dateSigned ?? undefined) : undefined),/' client/src/pages/DocumentForm.tsx
  echo "✅ Fix dateSigned appliqué"
else
  echo "✅ dateSigned OK"
fi

# Fix routers.ts nullable
if ! grep -q "dateSigned: z.string().nullable()" server/routers.ts; then
  echo "❌ Fix nullable manquant - correction automatique..."
  sed -i 's/dateSigned: z\.string()\.optional(),/dateSigned: z.string().nullable().optional(),/g' server/routers.ts
  echo "✅ Fix nullable appliqué"
else
  echo "✅ nullable OK"
fi

echo "✅ Vérification terminée"
