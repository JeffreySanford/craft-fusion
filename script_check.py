from pathlib import Path
text=Path('apps/craft-web/src/app/projects/timeline/components/timeline-item/timeline-item.component.scss').read_text()
bal=0
for i,c in enumerate(text,1):
    if c=='{': bal+=1
    elif c=='}': bal-=1
    if bal<0:
        print('negative at', i)
        break
print('final', bal)
