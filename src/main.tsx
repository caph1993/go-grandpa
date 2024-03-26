import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";


class RootDidMountTrigger extends React.Component {
  private _mounted: boolean = false;
  constructor(props: any) {
    super(props);
  }
  render() {
    // @ts-ignore
    return this.props.children;
  }
  componentDidMount() {
    if (!this._mounted) {
      this._mounted = true
      $(document).trigger("root-did-mount");
    }
  }
}
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootDidMountTrigger>
      <App />
    </RootDidMountTrigger>
  </React.StrictMode>
);
