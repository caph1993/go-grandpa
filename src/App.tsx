import "@mantine/core/styles.css";
import { ActionIcon, Button, Center, MantineProvider, rem } from "@mantine/core";
import { theme } from "./theme";
import { AppShell, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo } from "react";
import { IconArrowBarToDown, IconArrowBarUp, IconCircle, IconSquare, IconTriangle, IconUser, IconX } from "@tabler/icons-react";
import { SegmentedControl } from '@mantine/core';
import { useMyLocalStorage2 } from "./useMyLocalStorage";


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
      <AppShell.Navbar p="md">
        {/* <span>
          <img src="/public/favicon.png" width={25} />
        </span> */}
        Para jugar entre el jóven y el viejo.
        <Button onClick={() => $(document).trigger('reset')}>
          Reiniciar
        </Button>
      </AppShell.Navbar>
      <AppShell.Main>
        {useMemo(() => <div id="board"></div>, [])}
      </AppShell.Main>
      <AppShell.Footer>
        <Group dir="row" justify="space-around">
          <SegmentedControl
            value={action}
            onChange={setAction}
            data={[
              {
                value: 'add',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconArrowBarToDown style={{ width: rem(16), height: rem(16) }} />
                    <span>Colocar</span>
                  </Center>
                ),
              },
              {
                value: 'remove',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconArrowBarUp style={{ width: rem(16), height: rem(16) }} />
                    <span>Retirar</span>
                  </Center>
                ),
              },
              {
                value: 'indicate',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconArrowBarUp style={{ width: rem(16), height: rem(16) }} />
                    <span>Indicar</span>
                  </Center>
                ),
              },
            ]}
          />
        </Group>
      </AppShell.Footer>
    </AppShell >
  );
}


$(document).on("root-did-mount", function (_: any) {
  console.log(document.getElementById("board"))
  //@ts-ignore
  let WGo = window["WGo"];
  WGo.DIR = "/public";
  const width = Math.min(window.innerWidth - 30, 600, window.innerHeight - 30);
  var board = new WGo.Board(document.getElementById("board"), {
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
        //@ts-ignore
        this.fillStyle = "rgba(0,0,0,0.7)";
        //@ts-ignore
        this.textBaseline = "middle";
        //@ts-ignore
        this.textAlign = "center";
        //@ts-ignore
        this.font = board.stoneRadius + "px " + (board.font || "");
        xright = board.getX(-0.75);
        xleft = board.getX(board.size - 0.25);
        ytop = board.getY(-0.75);
        ybottom = board.getY(board.size - 0.25);
        for (var i = 0; i < board.size; i++) {
          ch = i + "A".charCodeAt(0);
          if (ch >= "I".charCodeAt(0)) ch++;
          t = board.getY(i);
          //@ts-ignore
          this.fillText(board.size - i, xright, t);
          //@ts-ignore
          this.fillText(board.size - i, xleft, t);
          t = board.getX(i);
          //@ts-ignore
          this.fillText(String.fromCharCode(ch), t, ytop);
          //@ts-ignore
          this.fillText(String.fromCharCode(ch), t, ybottom);
        }
        //@ts-ignore
        this.fillStyle = "black";
      }
    }
  }
  board.addCustomObject(coordinates);

  //@ts-ignore
  const socket = io({ path: '/go/socket.io' }) as any;
  // console.log(socket)
  socket.on('hist', (data: any) => {
    console.log('Received move:', data);
    data.forEach(handleMove);
    if (data.length < Object.keys(parsed).length) {
      // Out of sync. The game was reset.
      parsed = {}; // clear parsed moves
      board.removeAllObjects();
      data.forEach(handleMove);
    }
  });
  socket.on('users', (nUsers: number) => {
    $('#nUsers').text('x' + nUsers);
  });
  let parsed: any = {};
  function handleMove({ x, y, action, figure, black, hold, id }: any) {
    if (parsed[id]) return;
    parsed[id] = true;
    if (action == 'indicate') {
      const symbol = { 'triangle': 'TR', 'circle': 'CR', 'square': 'SQ' }[figure as string];
      const obj = { x: x, y: y, type: symbol };
      board.addObject(obj);
      if (!hold) setTimeout(() => board.removeObject(obj), 1000);
    } else if (action == 'add') {
      const obj = { x: x, y: y, c: black ? WGo.B : WGo.W };
      board.addObject(obj);
    } else if (action == "remove") {
      board.removeObjectsAt(x, y);
    }
  }
  $(document).on("reset", function (_: any) {
    if (confirm('¿Estás seguro de que deseas reiniciar el juego?')) {
      board.removeAllObjects();
      parsed = {};
      socket.emit('clear');
    }
  });

  board.addEventListener("click", function (x: number, y: number) {
    $(document).trigger("board-single-click", { x: x, y: y, board });
  });
  $(document).on("board-single-click", function (_: any, data: any) {
    const { x, y } = data;
    const time = new Date().toISOString();
    const id = time + Math.random();
    const move = { x, y, action: controls.action, figure: controls.figure, black: controls.black, hold: controls.hold, id, time };
    handleMove(move);
    socket.emit('move', move);
  });
});