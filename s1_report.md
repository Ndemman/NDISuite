# NDISuite Template Slug Resolution Fix - Implementation Report

## Overview
I've implemented the changes required in s1.txt to resolve the template slug resolution issue. The problem was that templates were being fetched successfully, but the backend response was missing the slug field, resulting in undefined keys in the template map: `{undefined: '4764e633-ddb4-4b79-b802-bb350e5ca6c2'}`.

## Changes Implemented

### 1. Backend Changes

#### Added Slug Field to Template Serializer
- Updated `backend/reports/serializers.py` to include a slug field in the TemplateSerializer
- Added a `get_slug` method that:
  - Extracts the slug from the template structure if it exists
  - Falls back to predefined mappings for common templates
  - Ultimately falls back to slugifying the template name

```python
slug = serializers.SerializerMethodField()  # Added to TemplateSerializer
```

```python
def get_slug(self, obj):
    # Extract slug from structure or generate from name
    if isinstance(obj.structure, dict) and 'slug' in obj.structure:
        return obj.structure['slug']
    
    # Otherwise, generate slug from name
    from django.utils.text import slugify
    name_to_slug_map = {
        'Progress Report': 'progress',
        'Assessment Report': 'assessment', 
        'Therapy Report': 'therapy',
    }
    
    # Use predefined mapping if available
    if obj.name in name_to_slug_map:
        return name_to_slug_map[obj.name]
    
    # Fallback to slugified name
    return slugify(obj.name)
```

#### Created Django Management Command
- Created a new management command at `backend/reports/management/commands/ensure_templates.py`
- This command ensures that default templates exist in the database with proper slugs
- For each template:
  - Creates it if it doesn't exist
  - Updates existing templates if they don't have a slug in their structure

### 2. Frontend Changes

#### Enhanced the useTemplates Hook
- Updated `frontend/src/hooks/useTemplates.ts` to validate templates have slugs
- Added filtering to skip templates without slugs
- Improved error handling and logging
- Added additional console logging for debugging

```typescript
// Filter out templates without slugs and warn
const validTemplates = templates.filter(t => {
  if (!t.slug) {
    console.warn(`[useTemplates] Template ${t.id} (${t.name}) is missing slug, skipping`);
    return false;
  }
  return true;
});
```

## Next Steps

For the changes to fully take effect, the following steps need to be performed:

1. Restart the backend service to pick up the serializer changes:
   ```bash
   docker compose restart backend
   ```

2. Run the management command to ensure templates exist:
   ```bash
   docker compose exec backend python manage.py ensure_templates
   ```

3. Clear browser cache and reload the application to test the template resolution

## Expected Behavior

After implementing these changes:
- The backend will return templates with a proper slug field
- The template map will correctly show template slugs as keys with corresponding UUIDs as values
- Report creation will use the correct UUID based on the template slug
- The UI will progress past the loading screen during report creation
