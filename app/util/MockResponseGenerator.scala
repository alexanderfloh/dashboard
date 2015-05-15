package util

import scala.concurrent.Future
import play.api.mvc.SimpleResult
import scala.io.Source
import java.util.Date
import scala.io.Codec

trait BuildType
case object CI extends BuildType
case object Nightly extends BuildType

object MockResponseGenerator {
  def apply(buildType: BuildType): String = buildType match {
    case CI =>
      Source.fromFile("ci-mock.txt")(Codec.UTF8).getLines.mkString
    case Nightly =>
      Source.fromFile("nightly-full.txt")(Codec.UTF8).getLines.mkString
  }
}