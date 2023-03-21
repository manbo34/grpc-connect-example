package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	greetv1 "example/gen/greet/v1"
	"example/gen/greet/v1/greetv1connect"

	"github.com/bufbuild/connect-go"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

type GreetServer struct{}

func (s *GreetServer) Greet(
	ctx context.Context,
	stream *connect.ClientStream[greetv1.GreetRequest],
) (*connect.Response[greetv1.GreetResponse], error) {
	log.Println("Request headers: ", stream.RequestHeader())
	var greeting strings.Builder
	for stream.Receive() {
		g := fmt.Sprintf("Hello, %s!\n", stream.Msg().Name)
		if _, err := greeting.WriteString(g); err != nil {
			return nil, connect.NewError(connect.CodeInternal, err)
		}
	}
	if err := stream.Err(); err != nil {
		return nil, connect.NewError(connect.CodeUnknown, err)
	}
	res := connect.NewResponse(&greetv1.GreetResponse{
		Greeting: greeting.String(),
	})
	res.Header().Set("Greet-Version", "v1")
	return res, nil
}

func main() {
	greeter := &GreetServer{}
	mux := http.NewServeMux()
	path, handler := greetv1connect.NewGreetServiceHandler(greeter)
	mux.Handle(path, handler)
	http.ListenAndServe(
		"localhost:8080",
		// Use h2c so we can serve HTTP/2 without TLS.
		h2c.NewHandler(mux, &http2.Server{}),
	)
}
