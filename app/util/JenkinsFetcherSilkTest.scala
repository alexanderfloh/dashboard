package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import models.NevergreenResult

object JenkinsFetcherSilkTest extends JenkinsFetcher {
  def prefix = "dashboard.silktest."
  // fetch main section builds with tests
  def fetchMain(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlCi")
      .getOrElse(throw new RuntimeException(prefix + "urlTrunk not configured"))
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]

      val urlRegression1 = Play.current.configuration.getString(prefix + "urlRegressions1")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions1 not configured"))
      val regressionName1 = Play.current.configuration.getString(prefix + "regressionName1")
        .getOrElse(throw new RuntimeException(prefix + "regressionName1 not configured"))

      val urlRegression2 = Play.current.configuration.getString(prefix + "urlRegressions2")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions2 not configured"))
      val regressionName2 = Play.current.configuration.getString(prefix + "regressionName2")
        .getOrElse(throw new RuntimeException(prefix + "regressionName2 not configured"))

      val urlRegression3 = Play.current.configuration.getString(prefix + "urlRegressions3")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions3 not configured"))
      val regressionName3 = Play.current.configuration.getString(prefix + "regressionName3")
        .getOrElse(throw new RuntimeException(prefix + "regressionName3 not configured"))

      val urlRegression4 = Play.current.configuration.getString(prefix + "urlRegressions4")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions4 not configured"))
      val regressionName4 = Play.current.configuration.getString(prefix + "regressionName4")
        .getOrElse(throw new RuntimeException(prefix + "regressionName4 not configured"))

      for {
        regression1 <- JenkinsFetcherUtil.fetchTests(urlRegression1, regressionName1)
        regression2 <- JenkinsFetcherUtil.fetchTests(urlRegression2, regressionName2)
        regression3 <- JenkinsFetcherUtil.fetchTests(urlRegression3, regressionName3)
        regression4 <- JenkinsFetcherUtil.fetchTests(urlRegression4, regressionName4)
        lastCompletedDetails <- details
        lastBuildDetails <- JenkinsFetcherUtil.fetchLastBuild(baseUrl, lastBuild)
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          val defaultStatus = Json.obj("status" -> "n/a", "name" -> "n/a")
          val result1 = regression1.getOrElse(buildNumber, defaultStatus)
          val result2 = regression2.getOrElse(buildNumber, defaultStatus)
          val result3 = regression3.getOrElse(buildNumber, defaultStatus)
          val result4 = regression4.getOrElse(buildNumber, defaultStatus)
          
          val regressions = Json.arr(
              result1,
              result2,
              result3,
              result4
              )
          jsVal + (("regressions", regressions))
          
        });
        Json.prettyPrint(Json.obj(mapName -> detailsWithTests, "lastBuild" -> lastBuildDetails))
      }
    }
  }

  // fetch aside build with nevergreen list
  def fetchAside(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlNightly")
      .getOrElse(throw new RuntimeException(prefix + "urlBuildAll not configured"))
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)
      for {
        lastCompletedDetails <- details
        nevergreensXML <- ScFetcher.fetchNevergreens
      } yield {
        val nevergreens = NevergreensParser.parse(nevergreensXML)
        implicit val nevergreensWrites = NevergreenResult.writes
        Json.prettyPrint(Json.obj(mapName -> lastCompletedDetails, "nevergreens" -> nevergreens))
      }
    }
  }
}