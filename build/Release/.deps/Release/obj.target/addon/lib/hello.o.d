cmd_Release/obj.target/addon/lib/hello.o := g++ '-DNODE_GYP_MODULE_NAME=addon' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DBUILDING_NODE_EXTENSION' -I/usr/include/nodejs/include/node -I/usr/include/nodejs/src -I/usr/include/nodejs/deps/uv/include -I/usr/include/nodejs/deps/v8/include  -fPIC -pthread -Wall -Wextra -Wno-unused-parameter -m64 -O3 -ffunction-sections -fdata-sections -fno-omit-frame-pointer -fno-rtti -fno-exceptions -std=gnu++0x -MMD -MF ./Release/.deps/Release/obj.target/addon/lib/hello.o.d.raw   -c -o Release/obj.target/addon/lib/hello.o ../lib/hello.cc
Release/obj.target/addon/lib/hello.o: ../lib/hello.cc \
 /usr/include/nodejs/src/node.h /usr/include/nodejs/deps/v8/include/v8.h \
 /usr/include/nodejs/deps/v8/include/v8-version.h \
 /usr/include/nodejs/deps/v8/include/v8config.h \
 /usr/include/nodejs/src/node_version.h
../lib/hello.cc:
/usr/include/nodejs/src/node.h:
/usr/include/nodejs/deps/v8/include/v8.h:
/usr/include/nodejs/deps/v8/include/v8-version.h:
/usr/include/nodejs/deps/v8/include/v8config.h:
/usr/include/nodejs/src/node_version.h:
