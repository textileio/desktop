package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"

	"main/pages"

	asti "github.com/asticode/go-astilectron"
	bootstrap "github.com/asticode/go-astilectron-bootstrap"
	astilog "github.com/asticode/go-astilog"
	jsonpb "github.com/golang/protobuf/jsonpb"

	fsrepo "github.com/ipfs/go-ipfs/repo/fsrepo"
	"github.com/mitchellh/go-homedir"
	"github.com/textileio/go-textile/core"
	"github.com/textileio/go-textile/gateway"
	"github.com/textileio/go-textile/keypair"
	"github.com/textileio/go-textile/pb"
	"github.com/textileio/go-textile/wallet"
)

var (
	appName = "Textile"
	appDir  string
	debug   = flag.Bool("d", false, "enables debug mode")
	app     *asti.Astilectron
	window  *asti.Window
	tray    *asti.Tray
	move    = true
)

// pbMarshaler is used to marshal protobufs to JSON
var pbMarshaler = jsonpb.Marshaler{
	OrigName: true,
}

var node *core.Textile

func main() {
	flag.Parse()
	astilog.FlagInit()
	bootstrapApp()
}

func startNode() error {
	if err := node.Start(); err != nil {
		astilog.Error(err)
		if err == core.ErrStarted {
			return nil
		}
		return err
	}

	// Subscribe to notifications
	go func() {
		for {
			select {
			case note, ok := <-node.NotificationCh():
				if !ok {
					return
				}
				// Send notification to JS land
				str, err := pbMarshaler.MarshalToString(note)
				if err != nil {
					astilog.Error(err)
				}
				var objmap map[string]interface{}
				err = json.Unmarshal([]byte(str), &objmap)
				if err != nil {
					astilog.Error(err)
				}
				sendData("notification", objmap)

				// Temporarily auto-accept thread invites
				if note.Type == pb.Notification_INVITE_RECEIVED {
					go func(tid string) {
						if _, err := node.AcceptInvite(tid); err != nil {
							astilog.Error(err)
						}
					}(note.Block)
				}
			}
		}
	}()

	// Setup and start the apis
	gateway.Host = &gateway.Gateway{
		Node: node,
	}
	node.StartApi(node.Config().Addresses.API, true)
	gateway.Host.Start(node.Config().Addresses.Gateway)

	// wait for node to come online
	<-node.OnlineCh()
	return nil
}

func stopNode() error {
	if err := node.Stop(); err != nil {
		astilog.Error(err)
		if err == core.ErrStopped {
			return nil
		}
		return err
	}
	if err := node.StopApi(); err != nil {
		return err
	}
	if err := gateway.Host.Stop(); err != nil {
		return err
	}

	return nil
}

func startTextile(address string, password string) error {
	repoPath := filepath.Join(appDir, address)
	// build textile node
	var err error
	node, err = core.NewTextile(core.RunConfig{
		PinCode:  password,
		RepoPath: repoPath,
		Debug:    true,
	})
	if err != nil {
		astilog.Error(err)
		return err
	}

	// bring the node online
	err = startNode()
	if err != nil {
		astilog.Error(err)
		return err
	}

	sendData("settings", node.Config().Addresses)

	// start the Pages app
	pages.Start(address, repoPath, node, appUpdate)

	return nil
}

func openAndStartTextile(address string, password string) error {
	return startTextile(address, password)
}

func initAndStartTextile(mnemonic string, password string) error {
	wallet := wallet.WalletFromMnemonic(mnemonic)
	// start with first account (default is not to use a password)
	accnt, err := wallet.AccountAt(0, "")
	if err != nil {
		return err
	}

	repoPath := filepath.Join(appDir, accnt.Address())

	// run init if needed
	if !fsrepo.IsInitialized(repoPath) {
		initc := core.InitConfig{
			Account:     accnt,
			PinCode:     password,
			RepoPath:    repoPath,
			LogToDisk:   true,
			Debug:       true,
			GatewayAddr: fmt.Sprintf("127.0.0.1:5050"),
			ApiAddr:     fmt.Sprintf("127.0.0.1:40600"),
		}
		if err := core.InitRepo(initc); err != nil {
			astilog.Fatal(fmt.Errorf("create repo failed: %s", err))
		}
	}

	return startTextile(accnt.Address(), password)
}

func computePosition(bounds *asti.RectangleOptions) (int, int, error) {
	if bounds != nil {
		x := *(bounds.X)
		y := *(bounds.Y)
		// Center window horizontally below the tray icon
		x = x - (WindowWidth / 2) + 10
		// Position window 16 pixels vertically below the tray icon
		y = y + 16
		return x, y, nil
	}
	return 0, 0, errors.New("invalid bounds object")
}

func start(a *asti.Astilectron, w []*asti.Window, _ *asti.Menu, t *asti.Tray, _ *asti.Menu) error {
	tray = t
	app = a
	window = w[0]
	window.Create()
	// remove the dock icon
	dock := app.Dock()
	dock.Hide()

	// get homedir
	home, err := homedir.Dir()
	if err != nil {
		astilog.Fatal(fmt.Errorf("get homedir failed: %s", err))
	}

	// ensure app support folder is created
	if runtime.GOOS == "darwin" {
		appDir = filepath.Join(home, "Library", "Application Support", "Textile")
	} else {
		appDir = filepath.Join(home, ".textile")
	}

	// publicDir contains appDir, so just try to create it all at once
	if err := os.MkdirAll(appDir, 0755); err != nil {
		astilog.Fatal(fmt.Errorf("create app dir failed: %s", err))
	}
	// Look for existing accounts
	files, err := ioutil.ReadDir(appDir)
	if err != nil {
		astilog.Fatal(fmt.Errorf("read app dir failed: %s", err))
	}

	var addresses []string
	for _, f := range files {
		if f.IsDir() {
			kp, err := keypair.Parse(f.Name())
			if err != nil {
				astilog.Warnf("invalid account address (%s), ignoring", err)
			} else {
				addresses = append(addresses, kp.Address())
			}
		}
	}
	// Tell Javascript about them
	// TODO: This should probably be pulled from JS, rather than pushed like this?
	sendData("addresses", addresses)

	tray.On(asti.EventNameTrayEventClicked, toggleWindow)
	tray.On(asti.EventNameTrayEventDoubleClicked, toggleWindow)
	window.On(asti.EventNameWindowEventBlur, func(e asti.Event) bool {
		window.Hide()
		return false
	})
	return nil
}

func toggleWindow(e asti.Event) bool {
	if window.IsShown() {
		window.Hide()
	} else {
		if !move {
			window.Show()
		}
		x, y, err := computePosition(e.Bounds)
		if err == nil {
			err = window.Move(x, y)
			if err != nil {
				astilog.Errorf("error positioning window: %s", err)
			}
		}
		if move {
			window.Show()
			move = false
		}
	}
	return false
}

// Method passed to go-app, Pages. Pages can then update app payload to tray
func appUpdate(data interface{}) {
	sendData("app-update", data)
}

func sendData(name string, data interface{}) {
	payload := map[string]interface{}{"name": name, "payload": data}
	window.SendMessage(payload)
}

// handleMessage handles incoming messages from Javascript/Electron
func handleMessage(w *asti.Window, m bootstrap.MessageIn) (interface{}, error) {
	switch m.Name {
	case "init":
		type init struct {
			Address  string `json:"address,omitempty"`
			Mnemonic string `json:"mnemonic,omitempty"`
			Password string `json:"password,omitempty"`
		}
		var payload init
		if err := json.Unmarshal(m.Payload, &payload); err != nil {
			return nil, err
		}
		var err error
		if payload.Mnemonic != "" {
			err = initAndStartTextile(payload.Mnemonic, payload.Password)
		} else if payload.Address != "" {
			err = openAndStartTextile(payload.Address, payload.Password)
		} else {
			err = errors.New("error provisioning Textile account")
		}
		if err != nil {
			return err.Error(), nil
		}
		return nil, nil
	case "hide":
		w.Hide()
	case "quit":
		app.Close()
		app.Quit()
	default:
		return nil, nil
	}
	return nil, nil
}
