package main

import (
	astilectron "github.com/asticode/go-astilectron"
	bootstrap "github.com/asticode/go-astilectron-bootstrap"
	astilog "github.com/asticode/go-astilog"
	errors "github.com/pkg/errors"
)

var (
	WindowWidth int = 300
)

// bootstrapApp runs bootstrap. Moved to own file so we don't have to see Asset and RestoreAsset highlighed as errors :)
func bootstrapApp() {
	homepage := "../index.html"
	if *debug {
		homepage = "http://127.0.0.1:3000"
		astilog.Info("running in debug/dev mode")
	}
	if err := bootstrap.Run(bootstrap.Options{
		Asset:    Asset,
		AssetDir: AssetDir,
		AstilectronOptions: astilectron.Options{
			AppName:            appName,
			AppIconDarwinPath:  "resources/assets/icon.icns",
			AppIconDefaultPath: "resources/assets/icon.png",
		},
		Debug:         !*debug,
		OnWait:        start,
		RestoreAssets: RestoreAssets,
		TrayOptions: &astilectron.TrayOptions{
			Image:   astilectron.PtrStr("resources/assets/TrayTemplate.png"),
			Tooltip: astilectron.PtrStr("Textile"),
		},
		Windows: []*bootstrap.Window{{
			Homepage:       homepage,
			MessageHandler: handleMessage,
			Options: &astilectron.WindowOptions{
				Width:          astilectron.PtrInt(300),
				Height:         astilectron.PtrInt(450),
				Show:           astilectron.PtrBool(false),
				Frame:          astilectron.PtrBool(false),
				Fullscreenable: astilectron.PtrBool(false),
				Transparent:    astilectron.PtrBool(true),
				Movable:        astilectron.PtrBool(false),
				Resizable:      astilectron.PtrBool(false),
				Minimizable:    astilectron.PtrBool(false),
				Maximizable:    astilectron.PtrBool(false),
				SkipTaskbar:    astilectron.PtrBool(true),
			},
		}},
	}); err != nil {
		astilog.Fatal(errors.Wrap(err, "bootstrap failed"))
	}
}
