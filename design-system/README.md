# 디자인 시스템

[ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)의 검색 스크립트로 생성했다.

```
python3 search.py "couple relationship app anniversary shared diary memory" \
  --design-system --variance 3 --density 4 --persist --tokens css -p "Uri"
```

- 스타일: Minimalism & Swiss Style (모서리 0, 그림자 없음, 포인트 색 하나, 격자 정렬)
- 색: Couple & Relationship App 팔레트 (`css/tokens.css`)
- 글꼴: 도구가 고른 Baloo 2 / Comic Neue는 한글이 없어, 같은 도구의 typography 검색 결과인
  "Korean Modern"(Noto Sans KR)으로 바꿨다. `css/style.css`에서 덮어쓴다.
- `--variance 3`: 기본값으로 돌리면 Aurora UI(그라데이션)가 나오는데, 둥글고 부드러운 느낌을
  피하려고 낮췄다.

`MASTER.md`, `tokens.json`, `css/tokens.css`는 도구가 만든 원본이다. 직접 고치지 않는다.

- 2026-11-26: 사용자 요청으로 글꼴을 손글씨체 Gaegu로 변경 (`fonts/gaegu`, `css/fonts.css`).

## 지도 자료
`data/regions.json` 은 통계청(KOSTAT) 2013년 행정구역 경계를 공개 저장소 southkorea/southkorea-maps 의 단순화본에서 받아 SVG 경로로 바꾼 것이다. 2013년 기준이라 그 뒤 바뀐 행정구역(예: 부천시 구, 청주·청원 통합, 군위군의 대구 편입)은 옛 모습이다.
