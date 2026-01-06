### 查看系统信息（CentOS 版本/内核/架构）

[root@iZvj200m7djluww4cnv9o7Z ~]# cat /etc/os-release
NAME="CentOS Linux"
VERSION="7 (Core)"
ID="centos"
ID_LIKE="rhel fedora"
VERSION_ID="7"
PRETTY_NAME="CentOS Linux 7 (Core)"
ANSI_COLOR="0;31"
CPE_NAME="cpe:/o:centos:centos:7"
HOME_URL="https://www.centos.org/"
BUG_REPORT_URL="https://bugs.centos.org/"

CENTOS_MANTISBT_PROJECT="CentOS-7"
CENTOS_MANTISBT_PROJECT_VERSION="7"
REDHAT_SUPPORT_PRODUCT="centos"
REDHAT_SUPPORT_PRODUCT_VERSION="7"

[root@iZvj200m7djluww4cnv9o7Z ~]# cat /etc/centos-release
CentOS Linux release 7.9.2009 (Core)
[root@iZvj200m7djluww4cnv9o7Z ~]# uname -a
Linux iZvj200m7djluww4cnv9o7Z 3.10.0-1160.95.1.el7.x86_64 #1 SMP Mon Jul 24 13:59:37 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux



### docker
[root@iZvj200m7djluww4cnv9o7Z ~]# docker version
Client:
 Version:         1.13.1
 API version:     1.26
 Package version: docker-1.13.1-210.git7d71120.el7.centos.x86_64
 Go version:      go1.10.3
 Git commit:      7d71120/1.13.1
 Built:           Wed Mar 20 16:04:34 2024
 OS/Arch:         linux/amd64

Server:
 Version:         1.13.1
 API version:     1.26 (minimum version 1.12)
 Package version: docker-1.13.1-210.git7d71120.el7.centos.x86_64
 Go version:      go1.10.3
 Git commit:      7d71120/1.13.1
 Built:           Wed Mar 20 16:04:34 2024
 OS/Arch:         linux/amd64
 Experimental:    false



