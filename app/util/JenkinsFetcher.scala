package util

import scala.concurrent.Future

trait JenkinsFetcher {
  def fetchMain(mapName: String, numberOfItems: Integer): Future[String]
  def fetchAside(mapName: String, numberOfItems: Integer): Future[String]
}