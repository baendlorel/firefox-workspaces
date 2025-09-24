# /bin/bash

# ! Give up because of this error:
# Profile Missing
# Your Firefox profile cannot be loaded.It may be missing or inaccessible.
cat <<EOF
# Instead of being puzzled by the "Profile Missing"" error, Try this instead
open firefox
visit about:debugging
load temporary add-on
select dist/manifest.json
EOF