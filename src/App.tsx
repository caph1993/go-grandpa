import "@mantine/core/styles.css";
import { ActionIcon, Button, Center, MantineProvider, rem } from "@mantine/core";
import { theme } from "./theme";
import { AppShell, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo } from "react";
import { IconArrowBarToDown, IconArrowBarUp, IconCircle, IconPointer, IconSquare, IconTriangle, IconUser, IconX } from "@tabler/icons-react";
// import { IconArrowBackUp, IconArrowForwardUp } from "@tabler/icons-react";
import { SegmentedControl } from '@mantine/core';
import { useMyLocalStorage2 } from "./useMyLocalStorage";
import { ThemeButtonMoonSun } from "./ThemeButtonMoonSun/ThemeButtonMoonSun";


export default function App() {
  return (
    <MantineProvider theme={theme}>
      <_App />
    </MantineProvider>
  )
}
//@ts-ignore
const controls = window['controls'] = { action: 'add', figure: 'triangle', black: true, hold: false };

function _App() {
  const [opened, { toggle }] = useDisclosure();
  const [black, setBlack] = useMyLocalStorage2('black', true);
  const [figure, setFigure] = useMyLocalStorage2('figure', 'triangle');
  const [hold, setHold] = useMyLocalStorage2('hold', false);
  const nextFigure = figure == 'triangle' ? 'circle' : figure == 'circle' ? 'square' : 'triangle';
  const nextHold = figure == 'square' ? !hold : hold;
  // const symbol = { 'triangle': '△', 'circle': '○', 'square': '□' }[figure];
  const symbol = { 'triangle': <IconTriangle />, 'circle': <IconCircle />, 'square': <IconSquare /> }[figure];
  const [action, setAction] = useMyLocalStorage2('action', 'indicate');
  Object.assign(controls, { action, figure, black, hold });

  // Check if mobile using mantine query
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Burger opened={opened} onClick={toggle} size="sm" />
          Go del viejo
          <Group>
            <IconUser />
            {useMemo(() => <div id="nUsers"></div>, [])}
          </Group>
          <Group>
            {action == 'add' && <ActionIcon children={black ? '⚫' : '⚪'} onClick={() => setBlack(!black)} />}
            {action == 'indicate' && <ActionIcon color={hold ? 'green' : 'blue'} children={symbol} onClick={() => {
              setFigure(nextFigure);
              if (nextHold != hold) setHold(nextHold);
            }} />}
            {action == 'remove' && <ActionIcon children={<IconX />} />}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" zIndex={320}>
        Para jugar entre el jóven y el viejo.
        <ThemeButtonMoonSun />
        <Button onClick={() => $(document).trigger('reset')}>
          Reiniciar
        </Button>

      </AppShell.Navbar>
      <AppShell.Main>
        {useMemo(() => <div id="board"></div>, [])}
      </AppShell.Main>
      <AppShell.Footer zIndex={319}>
        <Group dir="row" justify="space-around">
          {/* <ActionIcon children={<IconArrowBackUp />} onClick={() => $(document).trigger('undo')} /> */}
          <SegmentedControl
            value={action}
            onChange={setAction}
            data={[
              {
                value: 'add',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconArrowBarToDown style={{ width: rem(16), height: rem(16) }} />
                    {!isMobile && <span>Colocar</span>}
                  </Center>
                ),
              },
              {
                value: 'remove',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconArrowBarUp style={{ width: rem(16), height: rem(16) }} />
                    {!isMobile && <span>Retirar</span>}
                  </Center>
                ),
              },
              {
                value: 'indicate',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconPointer style={{ width: rem(16), height: rem(16) }} />
                    {!isMobile && <span>Indicar</span>}
                  </Center>
                ),
              },
            ]}
          />
          {/* <ActionIcon children={<IconArrowForwardUp />} onClick={() => $(document).trigger('redo')} /> */}
        </Group>
      </AppShell.Footer>
    </AppShell >
  );
}


import { WGo, MyBoard, numberSymbol, Cursor } from "./WGoBoardAdapter";


$(document).on("root-did-mount", function (_: any) {
  const width = Math.min(window.innerWidth - 30, 600, window.innerHeight - 30);
  const board = new MyBoard(document.getElementById("board")!, {
    width: width,
    size: 9,
    section: {
      top: -0.5,
      left: -0.5,
      right: -0.5,
      bottom: -0.5,
    },
  });
  //@ts-ignore
  window["B"] = board;
  var coordinates = {
    // draw on grid layer
    grid: {
      draw: function (_: any, board: any) {
        var ch, t, xright, xleft, ytop, ybottom;
        let _this = this as any;
        _this.fillStyle = "rgba(0,0,0,0.7)";
        _this.textBaseline = "middle";
        _this.textAlign = "center";
        _this.font = board.stoneRadius + "px " + (board.font || "");
        xright = board.getX(-0.75);
        xleft = board.getX(board.size - 0.25);
        ytop = board.getY(-0.75);
        ybottom = board.getY(board.size - 0.25);
        for (var i = 0; i < board.size; i++) {
          ch = i + "A".charCodeAt(0);
          if (ch >= "I".charCodeAt(0)) ch++;
          t = board.getY(i);
          _this.fillText(board.size - i, xright, t);
          _this.fillText(board.size - i, xleft, t);
          t = board.getX(i);
          _this.fillText(String.fromCharCode(ch), t, ytop);
          _this.fillText(String.fromCharCode(ch), t, ybottom);
        }
        _this.fillStyle = "black";
      }
    }
  }
  board.addCustomObject(coordinates);
  let nStones = 0;

  //@ts-ignore
  const socket = io({ path: '/go/socket.io' }) as any;

  socket.on('users', (nUsers: number) => {
    $('#nUsers').text('x' + nUsers);
  });

  // console.log(socket)
  socket.on('hist', (data: any) => {
    // console.log('Received hist:', data);
    data.forEach(handleMove);
    // Check out of sync
    const lastTime = data.length && new Date(data.slice(-1)[0].time).getTime();
    const outOfDate = new Date().getTime() > lastTime + 5000;
    if (!outOfDate) return;
    parsed = {}; // clear parsed moves
    board.removeAllObjects();
    nStones = data
      .map((move: any) => move.action == 'add' ? 1 : move.action == 'remove' ? -1 : 0)
      .reduce((a: number, b: number) => a + b, 0);
    data.forEach(handleMove);
  });

  let parsed: any = {};
  function handleMove({ x, y, action, figure, black, id, num }: any) {
    if (parsed[id]) return;
    parsed[id] = true;
    if (action == 'indicate') {
      const symbol = { 'triangle': 'TR', 'circle': 'CR', 'square': 'SQ' }[figure as string];
      const obj = { x: x, y: y, type: symbol };
      board.addObject(obj);
    } else if (action == 'add') {
      const obj = { x: x, y: y, c: black ? WGo.B : WGo.W };
      board.addObject(obj);
      if (num != undefined) {
        const obj = { x: x, y: y, type: numberSymbol, customType: num };
        // Delete old movements
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            for (let obj of board.obj_arr[i][j]) {
              let k = parseInt(obj.customType);
              if (isNaN(obj.customType)) continue;
              if (k <= 0 || k < nStones) board.removeObject(obj);
            }
          }
        }
        board.addObject(obj);
      }
    } else if (action == "remove") {
      board.removeObjectsAt(x, y);
    }
  }

  socket.on('quick-marker', (data: any) => {
    const { x, y, figure } = data;
    showQuickMarker(x, y, figure);
  });
  function showQuickMarker(x: number, y: number, figure: string) {
    const symbol = { 'triangle': 'TR', 'circle': 'CR', 'square': 'SQ' }[figure as string];
    const obj = { x: x, y: y, type: symbol };
    board.addObject(obj);
    setTimeout(() => board.removeObject(obj), 1000);
  }

  $(document).on("reset", function (_: any) {
    if (confirm('¿Estás seguro de que deseas reiniciar el juego?')) {
      board.removeAllObjects();
      parsed = {};
      socket.emit('clear');
      nStones = 0;
    }
  });

  board.addEventListener("click", function (x: number, y: number) {
    $(document).trigger("board-single-click", { x: x, y: y, board });
  });
  // board.addEventListener('contextmenu', function (ev: any, data: any) {
  //   ev.preventDefault();
  //   const { x, y } = data;
  //   const action = 'remove';
  //   const there = board.obj_arr[x][y].filter((obj: any) => obj.c == WGo.B || obj.c == WGo.W);
  //   if (action == 'remove' && there.length == 0) return;
  //   const id = new Date().toISOString() + Math.random();
  //   nStones -= 1;
  //   const move = { x, y, action, figure: controls.figure, black: controls.black, hold: controls.hold, id, num: nStones };
  //   handleMove(move);
  //   socket.emit('move', move);
  //   return false;
  // }, false);

  $(document).on("board-single-click", function (_: any, data: any) {
    const { x, y } = data;
    if (x < 0 || y < 0 || x >= board.size || y >= board.size) return;
    const action = controls.action;
    if (action == 'indicate' && !controls.hold) {
      showQuickMarker(x, y, controls.figure);
      socket.emit('quick-marker', { x, y, figure: controls.figure });
      return;
    }
    const there = board.obj_arr[x][y].filter((obj: any) => obj.c == WGo.B || obj.c == WGo.W);
    if (action == 'add' && there.length > 0) return;
    if (action == 'remove' && there.length == 0) return;
    const id = new Date().toISOString() + Math.random();
    nStones += action == 'add' ? 1 : action == 'remove' ? -1 : 0;
    const move = {
      x, y, action,
      figure: controls.figure,
      black: controls.black,
      hold: controls.hold,
      id, num: nStones
    };
    handleMove(move);
    socket.emit('move', move);
  });

  // Show hisCursor (DONE)
  // Add numbers (DONE)
  // Add undo/redo ...

  let myCursor = new Cursor("#0f24e788", board);
  let hisCursor = new Cursor("#eb131388", board);
  socket.on('cursor', (data: any) => {
    const { x, y } = data;
    hisCursor.update(x, y);
  });

  board.addEventListener("mousemove", function (x: number, y: number) {
    const changed = x != myCursor.boardObj.x || y != myCursor.boardObj.y;
    myCursor.update(x, y);
    if (changed) socket.emit('cursor', { x: myCursor.boardObj.x, y: myCursor.boardObj.y });
  });

  board.addEventListener("touchmove", function (_: any, __: any, e: any) {
    // console.log('touchmove', e);
    const { x, y } = board.getMousePos(e.touches[0].clientX, e.touches[0].clientY - board.top);
    const { x: oldX, y: oldY } = myCursor.boardObj;
    const changed = x != oldX || y != oldY;
    myCursor.update(x, y);
    if (changed) socket.emit('cursor', { x: myCursor.boardObj.x, y: myCursor.boardObj.y });
  });

});
