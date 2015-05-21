package util

object JenkinsFetcherFactory {

  def getFetcher(fetcher:String): JenkinsFetcher = {
    fetcher match {
      case "performer" => JenkinsFetcherPerformer
      case "silktest"  => JenkinsFetcherSilkTest
    }
  }
}