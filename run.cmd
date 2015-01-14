REM @echo off
cmd /c kill.cmd

set java_opts=-Dconfig.file=conf/prod.conf -Dhttp.port=80 -Dfile.separator=\/ 
activator run
