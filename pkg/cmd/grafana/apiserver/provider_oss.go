package apiserver

import "fmt"

func GetXXX() StandaloneAPIProvider {
	fmt.Printf("OSS")
	return &DummyAPIProvider{}
}
