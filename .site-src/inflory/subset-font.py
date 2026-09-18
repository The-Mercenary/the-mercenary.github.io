"""Generate a small OFL-compliant, renamed font subset; fonttools[woff] required."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[2]
font = TTFont(root / '.qa/inflory/font-source/PretendardVariable.woff2')
options = subset.Options()
options.flavor = 'woff2'
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=(root / '.site-src/inflory/content.mjs').read_text() + ''.join(map(chr, range(32, 127))) + '↗')
subsetter.subset(font)
# Modified font cannot retain the reserved name Pretendard. Keep copyright/license.
names = {1:'Inflory Sans', 2:'Regular', 3:'InflorySans-Subset-1.0', 4:'Inflory Sans', 6:'InflorySans-Regular', 16:'Inflory Sans', 17:'Regular'}
for record in font['name'].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = 'woff2'
font.save(root / 'inflory/assets/pretendard-subset.woff2')
print('Generated Inflory Sans: subset derived from Pretendard v1.3.9; OFL retained.')
