# Kopia pliku PNG ramki — wykonaj raz ręcznie

## Co i gdzie

Plik źródłowy:
  C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\Companion Frame.png

Cel:
  C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\clawcard-builder\public\frames\Companion Frame.png

## Komenda (w terminalu lub PowerShell)

```
copy "C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\Companion Frame.png" "C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\clawcard-builder\public\frames\Companion Frame.png"
```

## Dlaczego

Nowy projekt (Vite) serwuje pliki z /public/ pod /.
FRAME_CONFIGS.companion.frameFile === '/frames/Companion Frame.png'
Bez tego pliku CompanionFrame renderuje kartę bez ramki PNG (fallback CSS).

## Co jeszcze skopiować (gdy będziesz miał)

namandi.jpg:
  source: C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\assets\cards\namandi.jpg
  dest:   C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\clawcard-builder\public\cards\namandi.jpg

Obrazki kart Wildfrost (opcjonalnie, gdy będziesz chciał):
  source: C:\Users\Qoope\godot_projects\clawcard_base\wildfrost_data\images\*.png
  dest:   C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\clawcard-builder\public\cards\
  W sampleCards.ts odkomentuj imageUrl: '/cards/NazwaPliku.png'
